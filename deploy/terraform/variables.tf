# ─── General ───
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

# ─── VPC ───
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# ─── EKS ───
variable "eks_public_access_cidrs" {
  description = "CIDRs allowed to access EKS public endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "eks_core_instance_types" {
  description = "Instance types for core node group"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "eks_core_desired_size" {
  description = "Desired node count for core node group"
  type        = number
  default     = 2
}

variable "eks_core_min_size" {
  description = "Minimum node count for core node group"
  type        = number
  default     = 2
}

variable "eks_core_max_size" {
  description = "Maximum node count for core node group"
  type        = number
  default     = 6
}

variable "eks_challenge_instance_types" {
  description = "Instance types for challenge node group"
  type        = list(string)
  default     = ["t3.xlarge", "t3.2xlarge"]
}

variable "eks_challenge_desired_size" {
  description = "Desired node count for challenge node group"
  type        = number
  default     = 2
}

variable "eks_challenge_min_size" {
  description = "Minimum node count for challenge node group"
  type        = number
  default     = 1
}

variable "eks_challenge_max_size" {
  description = "Maximum node count for challenge node group"
  type        = number
  default     = 10
}

# ─── RDS PostgreSQL ───
variable "postgres_instance_class" {
  description = "Instance class for PostgreSQL instances"
  type        = string
  default     = "db.serverless"
}

variable "postgres_instance_count" {
  description = "Number of PostgreSQL instances"
  type        = number
  default     = 2
}

variable "postgres_min_capacity" {
  description = "Minimum ACU capacity for serverless PostgreSQL"
  type        = number
  default     = 2
}

variable "postgres_max_capacity" {
  description = "Maximum ACU capacity for serverless PostgreSQL"
  type        = number
  default     = 16
}

# ─── ElastiCache Redis ───
variable "redis_node_type" {
  description = "Node type for Redis cluster"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_nodes" {
  description = "Number of Redis replica nodes"
  type        = number
  default     = 2
}

# ─── DocumentDB MongoDB ───
variable "docdb_instance_class" {
  description = "Instance class for DocumentDB"
  type        = string
  default     = "db.r6g.large"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 2
}

# ─── Bastion ───
variable "enable_bastion" {
  description = "Enable bastion host"
  type        = bool
  default     = false
}

variable "bastion_key_name" {
  description = "EC2 key pair name for bastion"
  type        = string
  default     = ""
}

variable "bastion_cidrs" {
  description = "CIDRs allowed to access bastion and internal services"
  type        = list(string)
  default     = []
}

# ─── DNS ───
variable "domain_name" {
  description = "Domain name for Route53 zone"
  type        = string
  default     = "bheda.ctf"
}

# ─── WAF Rate Limit ───
variable "waf_rate_limit" {
  description = "Rate limit for WAF (requests per 5 minutes)"
  type        = number
  default     = 5000
}
