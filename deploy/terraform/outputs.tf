# ─── Cluster ───
output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "eks_oidc_provider" {
  description = "EKS OIDC provider URL"
  value       = module.eks.oidc_provider
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = module.eks.oidc_provider_arn
}

output "eks_node_security_group_id" {
  description = "EKS node security group ID"
  value       = module.eks.node_security_group_id
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

# ─── Load Balancer ───
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.arn
}

output "alb_zone_id" {
  description = "ALB Route53 zone ID"
  value       = module.alb.zone_id
}

# ─── Database ───
output "rds_cluster_endpoint" {
  description = "RDS PostgreSQL cluster endpoint"
  value       = aws_rds_cluster.postgres.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS PostgreSQL reader endpoint"
  value       = aws_rds_cluster.postgres.reader_endpoint
}

output "rds_cluster_arn" {
  description = "RDS cluster ARN"
  value       = aws_rds_cluster.postgres.arn
}

output "rds_master_username" {
  description = "RDS master username"
  value       = aws_rds_cluster.postgres.master_username
  sensitive   = true
}

output "rds_master_password" {
  description = "RDS master password"
  value       = random_password.postgres_master.result
  sensitive   = true
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_addresses
}

output "redis_auth_token" {
  description = "Redis auth token"
  value       = random_password.redis_auth.result
  sensitive   = true
}

output "docdb_cluster_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.mongodb.endpoint
}

output "docdb_master_username" {
  description = "DocumentDB master username"
  value       = aws_docdb_cluster.mongodb.master_username
  sensitive   = true
}

output "docdb_master_password" {
  description = "DocumentDB master password"
  value       = random_password.docdb_master.result
  sensitive   = true
}

# ─── Storage ───
output "s3_bucket_id" {
  description = "S3 bucket ID for MinIO storage"
  value       = aws_s3_bucket.minio.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.minio.arn
}

# ─── DNS ───
output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.bheda.zone_id
}

output "route53_nameservers" {
  description = "Route53 nameservers"
  value       = aws_route53_zone.bheda.name_servers
}

# ─── ACM ───
output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.bheda.arn
}

# ─── WAF ───
output "waf_web_acl_arn" {
  description = "WAF web ACL ARN"
  value       = aws_wafv2_web_acl.bheda.arn
}

output "waf_web_acl_id" {
  description = "WAF web ACL ID"
  value       = aws_wafv2_web_acl.bheda.id
}

# ─── VPC ───
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "vpc_public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

# ─── IAM ───
output "backend_iam_role_arn" {
  description = "Backend IAM role ARN"
  value       = aws_iam_role.backend.arn
}

output "backend_iam_role_name" {
  description = "Backend IAM role name"
  value       = aws_iam_role.backend.name
}

# ─── Bastion ───
output "bastion_public_ip" {
  description = "Bastion public IP"
  value       = var.enable_bastion ? aws_instance.bastion[0].public_ip : null
}

# ─── Connection Strings ───
output "connection_strings" {
  description = "Database connection strings for application config"
  value = {
    postgres = "postgresql+asyncpg://bheda:${random_password.postgres_master.result}@${aws_rds_cluster.postgres.endpoint}:5432/bheda"
    redis    = "redis://:${random_password.redis_auth.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379/0"
    mongodb  = "mongodb://bheda:${random_password.docdb_master.result}@${aws_docdb_cluster.mongodb.endpoint}:27017/bheda?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  }
  sensitive = true
}
