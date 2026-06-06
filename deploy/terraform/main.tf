terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    # The bucket and DynamoDB table are managed below in this same module.
    # The bucket name is parameterized at apply time; set it via:
    #   terraform init -backend-config="bucket=..."
    bucket         = "bheda-${var.environment}-terraform-state"
    key            = "bheda/terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    kms_key_id     = aws_kms_key.terraform_state.arn
    dynamodb_table = aws_dynamodb_table.terraform_locks.name
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Bheda"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "github.com/atirathi/bheda"
    }
  }
}

# ─── VPC ───
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "bheda-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment != "production"
  enable_dns_hostnames   = true
  enable_dns_support     = true
  enable_vpn_gateway     = false

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "karpenter.sh/discovery"          = "bheda-${var.environment}"
  }

  tags = {
    "kubernetes.io/cluster/bheda-${var.environment}" = "shared"
  }
}

# ─── EKS Cluster ───
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "bheda-${var.environment}"
  cluster_version = "1.28"

  cluster_endpoint_public_access           = true
  cluster_endpoint_private_access          = true
  cluster_endpoint_public_access_cidrs     = var.eks_public_access_cidrs

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  enable_irsa = true

  eks_managed_node_groups = {
    core = {
      desired_size = var.eks_core_desired_size
      min_size     = var.eks_core_min_size
      max_size     = var.eks_core_max_size

      instance_types = var.eks_core_instance_types

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 50
            volume_type           = "gp3"
            encrypted             = true
            delete_on_termination = true
          }
        }
      }

      labels = {
        node-group-type = "core"
        role            = "general"
      }

      tags = {
        "k8s.io/cluster-autoscaler/enabled" = "true"
      }
    }

    challenge = {
      desired_size = var.eks_challenge_desired_size
      min_size     = var.eks_challenge_min_size
      max_size     = var.eks_challenge_max_size

      instance_types = var.eks_challenge_instance_types

      taints = {
        dedicated = {
          key    = "dedicated"
          value  = "challenges"
          effect = "NO_SCHEDULE"
        }
      }

      labels = {
        node-group-type = "challenge"
        role            = "challenges"
      }

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 100
            volume_type           = "gp3"
            encrypted             = true
            delete_on_termination = true
          }
        }
      }

      tags = {
        "k8s.io/cluster-autoscaler/enabled" = "true"
      }
    }
  }

  node_security_group_additional_rules = {
    cluster_to_node_all = {
      description      = "Cluster to node all traffic"
      protocol         = "-1"
      from_port        = 0
      to_port          = 0
      type             = "ingress"
      source_cluster_security_group = true
    }
  }

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
}

# ─── RDS PostgreSQL ───
resource "aws_db_subnet_group" "postgres" {
  name       = "bheda-${var.environment}-postgres-subnets"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "bheda-${var.environment}-postgres-subnets"
  }
}

resource "aws_rds_cluster" "postgres" {
  cluster_identifier      = "bheda-${var.environment}-aurora"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "16.1"
  database_name           = "bheda"
  master_username         = "bheda"
  master_password         = random_password.postgres_master.result
  port                    = 5432
  db_subnet_group_name    = aws_db_subnet_group.postgres.name
  vpc_security_group_ids  = [aws_security_group.postgres.id]
  storage_encrypted       = true
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "bheda-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  deletion_protection     = var.environment == "production"

  serverlessv2_scaling_configuration {
    min_capacity = var.postgres_min_capacity
    max_capacity = var.postgres_max_capacity
  }
}

resource "aws_rds_cluster_instance" "postgres" {
  count              = var.postgres_instance_count
  identifier         = "bheda-${var.environment}-pg-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.postgres.id
  instance_class     = var.postgres_instance_class
  engine             = aws_rds_cluster.postgres.engine
  engine_version     = aws_rds_cluster.postgres.engine_version
  db_subnet_group_name = aws_db_subnet_group.postgres.name
}

resource "aws_security_group" "postgres" {
  name        = "bheda-${var.environment}-postgres-sg"
  description = "Security group for Bheda PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from EKS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  ingress {
    description     = "PostgreSQL from bastion"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = var.bastion_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bheda-${var.environment}-postgres-sg"
  }
}

# ─── ElastiCache Redis ───
resource "aws_elasticache_subnet_group" "redis" {
  name       = "bheda-${var.environment}-redis-subnets"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "bheda-${var.environment}-redis"
  description                = "Bheda Redis cluster"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_num_nodes
  parameter_group_name       = "default.redis7.cluster.on"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = var.environment == "production"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result

  log_delivery_configuration {
    destination_type = "cloudwatch-logs"
    destination      = aws_cloudwatch_log_group.redis.name
    log_format       = "json"
  }
}

resource "aws_security_group" "redis" {
  name        = "bheda-${var.environment}-redis-sg"
  description = "Security group for Bheda Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from EKS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bheda-${var.environment}-redis-sg"
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/bheda-${var.environment}-redis"
  retention_in_days = 30
}

# ─── DocumentDB MongoDB ───
resource "aws_docdb_subnet_group" "mongodb" {
  name       = "bheda-${var.environment}-docdb-subnets"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier              = "bheda-${var.environment}-docdb"
  engine                          = "docdb"
  engine_version                  = "5.0"
  master_username                 = "bheda"
  master_password                 = random_password.docdb_master.result
  port                            = 27017
  db_subnet_group_name            = aws_docdb_subnet_group.mongodb.name
  vpc_security_group_ids          = [aws_security_group.mongodb.id]
  storage_encrypted               = true
  backup_retention_period         = 30
  preferred_backup_window         = "04:00-05:00"
  skip_final_snapshot             = var.environment != "production"
  deletion_protection             = var.environment == "production"
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]
}

resource "aws_docdb_cluster_instance" "mongodb" {
  count              = var.docdb_instance_count
  identifier         = "bheda-${var.environment}-docdb-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.mongodb.id
  instance_class     = var.docdb_instance_class
}

resource "aws_security_group" "mongodb" {
  name        = "bheda-${var.environment}-docdb-sg"
  description = "Security group for Bheda DocumentDB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "MongoDB from EKS"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bheda-${var.environment}-docdb-sg"
  }
}

# ─── S3 for MinIO ───
resource "aws_s3_bucket" "minio" {
  bucket = "bheda-${var.environment}-storage"
}

resource "aws_s3_bucket_versioning" "minio" {
  bucket = aws_s3_bucket.minio.id
  versioning_configuration {
    status = var.environment == "production" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "minio" {
  bucket = aws_s3_bucket.minio.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "minio" {
  bucket = aws_s3_bucket.minio.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "minio" {
  bucket = aws_s3_bucket.minio.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    expiration {
      days = 90
    }
  }
}

# ─── Application Load Balancer ───
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name = "bheda-${var.environment}-alb"

  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]

  enable_deletion_protection = var.environment == "production"

  access_logs = {
    bucket = aws_s3_bucket.minio.id
    prefix = "logs/alb"
  }

  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    https = {
      port            = 443
      protocol        = "HTTPS"
      certificate_arn = aws_acm_certificate.bheda.arn
      forward = {
        target_group_key = "bheda"
      }
    }
  }

  target_groups = {
    bheda = {
      name_prefix          = "bheda-"
      backend_protocol     = "HTTP"
      backend_port         = 80
      target_type          = "ip"
      health_check = {
        enabled             = true
        path                = "/api/v1/health"
        port                = "traffic-port"
        healthy_threshold   = 3
        unhealthy_threshold = 3
        timeout             = 10
        interval            = 30
        matcher             = "200"
      }
    }
  }

  rules = {
    api = {
      listener_key = "https"
      priority     = 10
      actions = [
        {
          type               = "forward"
          target_group_key   = "bheda"
        }
      ]
      conditions = [{
        path_patterns = ["/api/*"]
      }]
    }
    frontend = {
      listener_key = "https"
      priority     = 20
      actions = [
        {
          type               = "forward"
          target_group_key   = "bheda"
        }
      ]
      conditions = [{
        path_patterns = ["/*"]
      }]
    }
  }

  tags = {
    Name = "bheda-${var.environment}-alb"
  }
}

resource "aws_security_group" "alb" {
  name        = "bheda-${var.environment}-alb-sg"
  description = "Security group for Bheda ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bheda-${var.environment}-alb-sg"
  }
}

# ─── ACM Certificate ───
resource "aws_acm_certificate" "bheda" {
  domain_name       = "bheda.ctf"
  subject_alternative_names = ["*.bheda.ctf"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "bheda-${var.environment}-cert"
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.bheda.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.bheda.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "bheda" {
  certificate_arn         = aws_acm_certificate.bheda.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ─── Route53 ───
resource "aws_route53_zone" "bheda" {
  name = "bheda.ctf"

  tags = {
    Name = "bheda-${var.environment}-zone"
  }
}

resource "aws_route53_record" "alb" {
  zone_id = aws_route53_zone.bheda.zone_id
  name    = "bheda.ctf"
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "wildcard" {
  zone_id = aws_route53_zone.bheda.zone_id
  name    = "*.bheda.ctf"
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "traefik" {
  zone_id = aws_route53_zone.bheda.zone_id
  name    = "traefik.bheda.ctf"
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "minio" {
  zone_id = aws_route53_zone.bheda.zone_id
  name    = "minio.bheda.ctf"
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

# ─── WAF for ALB ───
resource "aws_wafv2_web_acl" "bheda" {
  name        = "bheda-${var.environment}-waf"
  description = "WAF for Bheda application"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 5000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "bhedaRateLimit"
      sampled_requests_enabled  = true
    }
  }

  # SQL injection protection
  rule {
    name     = "sqli-protection"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "bhedaSQLiProtection"
      sampled_requests_enabled  = true
    }
  }

  # XSS protection
  rule {
    name     = "xss-protection"
    priority = 3

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesXSSRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "bhedaXSSProtection"
      sampled_requests_enabled  = true
    }
  }

  # Common rule set
  rule {
    name     = "core-rules"
    priority = 4

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
        excluded_rule = ["SizeRestrictions_BODY"]
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "bhedaCommonRules"
      sampled_requests_enabled  = true
    }
  }

  # IP reputation
  rule {
    name     = "ip-reputation"
    priority = 5

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "bhedaIPReputation"
      sampled_requests_enabled  = true
    }
  }

  # IP allowlist
  rule {
    name     = "ip-allowlist"
    priority = 0

    action {
      count {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.bastion.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "bhedaAllowlist"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "bhedaWAF"
    sampled_requests_enabled  = true
  }
}

resource "aws_wafv2_ip_set" "bastion" {
  name               = "bheda-${var.environment}-bastion-ips"
  description        = "Allowed bastion IPs for Bheda"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.bastion_cidrs
}

resource "aws_wafv2_web_acl_association" "bheda" {
  resource_arn = module.alb.arn
  web_acl_arn  = aws_wafv2_web_acl.bheda.arn
}

# ─── CloudWatch ───
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/bheda-${var.environment}/cluster"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/eks/bheda-${var.environment}/backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "vuln_app" {
  name              = "/aws/eks/bheda-${var.environment}/vuln-app"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "waf_logs" {
  name              = "/aws/waf/bheda-${var.environment}"
  retention_in_days = 30
}

# ─── IAM ───
resource "aws_iam_role" "backend" {
  name = "bheda-${var.environment}-backend-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${module.eks.oidc_provider}:sub" = "system:serviceaccount:bheda:backend"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "backend" {
  name = "bheda-${var.environment}-backend-policy"
  role = aws_iam_role.backend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.minio.arn,
          "${aws_s3_bucket.minio.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.postgres.cluster_resource_id}/bheda"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:Connect"
        ]
        Resource = aws_elasticache_replication_group.redis.arn
      }
    ]
  })
}

# ─── Random Passwords ───
resource "random_password" "postgres_master" {
  length  = 24
  special = false
}

resource "random_password" "redis_auth" {
  length  = 24
  special = false
}

resource "random_password" "docdb_master" {
  length  = 24
  special = false
}

# ─── Data Sources ───
data "aws_caller_identity" "current" {}

# ─── Bastion ───
resource "aws_instance" "bastion" {
  count = var.enable_bastion ? 1 : 0

  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.nano"
  subnet_id              = module.vpc.public_subnets[0]
  vpc_security_group_ids = [aws_security_group.bastion[0].id]
  key_name               = var.bastion_key_name

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y postgresql15 redis6 mongodb-clients kubectl
    curl -o /usr/local/bin/kubectl https://s3.us-east-1.amazonaws.com/amazon-eks/1.28.3/2024-01-04/bin/linux/amd64/kubectl
    chmod +x /usr/local/bin/kubectl
  EOF

  tags = {
    Name = "bheda-${var.environment}-bastion"
  }
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_security_group" "bastion" {
  count = var.enable_bastion ? 1 : 0

  name        = "bheda-${var.environment}-bastion-sg"
  description = "Security group for Bheda bastion"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bheda-${var.environment}-bastion-sg"
  }
}

# ─── Terraform State Backend ───
# Manages the S3 bucket and DynamoDB lock table referenced from `terraform { backend "s3" }`.
# This module MUST be applied first (before any other resource), then `terraform init`
# to migrate state into the new bucket.
resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/bheda-terraform-state"
  target_key_id = aws_kms_key.terraform_state.key_id
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "bheda-${var.environment}-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "terraform_state" {
  bucket        = aws_s3_bucket.terraform_state.id
  target_bucket = aws_s3_bucket.minio.id
  target_prefix = "logs/terraform-state/"
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "bheda-${var.environment}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.terraform_state.arn
  }
}
