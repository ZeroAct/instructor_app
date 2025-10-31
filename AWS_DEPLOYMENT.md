# AWS Deployment Guide

This guide will help you deploy the Instructor App to AWS cloud, even if you have no prior AWS experience.

## Table of Contents

- [Prerequisites](#prerequisites)
- [What is AWS?](#what-is-aws)
- [Deployment Options](#deployment-options)
- [Option 1: AWS App Runner (Easiest)](#option-1-aws-app-runner-easiest)
- [Option 2: Amazon ECS with Fargate](#option-2-amazon-ecs-with-fargate)
- [Option 3: EC2 with Docker](#option-3-ec2-with-docker)
- [Option 4: AWS Elastic Beanstalk](#option-4-aws-elastic-beanstalk)
- [Setting up Environment Variables](#setting-up-environment-variables)
- [Custom Domain Setup](#custom-domain-setup)
- [Cost Estimation](#cost-estimation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you start, you'll need:

1. **AWS Account**: Sign up at [https://aws.amazon.com](https://aws.amazon.com)
   - You'll need a credit card, but AWS offers a free tier for new users
   - Free tier includes 12 months of free services within usage limits

2. **API Keys**: 
   - OpenAI API key (get from [https://platform.openai.com](https://platform.openai.com))
   - And/or Anthropic API key (get from [https://console.anthropic.com](https://console.anthropic.com))
   - You can configure one or both keys depending on which AI providers you want to use

3. **AWS CLI** (optional but recommended):
   ```bash
   # Install AWS CLI
   # For macOS
   brew install awscli
   
   # For Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # For Windows
   # Download from: https://awscli.amazonaws.com/AWSCLIV2.msi
   
   # Configure AWS CLI
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, region, and output format
   ```

## What is AWS?

AWS (Amazon Web Services) is a cloud platform that provides computing resources over the internet. Instead of buying and maintaining your own servers, you rent computing power from AWS. Key concepts:

- **Region**: Physical location of AWS data centers (e.g., us-east-1, eu-west-1)
- **Container**: A packaged application with all its dependencies (we use Docker)
- **Service**: A specific AWS product (like App Runner, ECS, EC2)

## Deployment Options

We'll cover four deployment options, from easiest to most customizable:

| Option | Difficulty | Cost | Best For |
|--------|-----------|------|----------|
| App Runner | ⭐ Easiest | $$ | Beginners, quick deployment |
| ECS Fargate | ⭐⭐ Easy | $$ | Production apps, auto-scaling |
| EC2 | ⭐⭐⭐ Moderate | $ | Full control, cost optimization |
| Elastic Beanstalk | ⭐⭐ Easy | $$ | Multi-container apps |

## Option 1: AWS App Runner (Easiest)

**Best for**: Beginners who want the simplest deployment

AWS App Runner automatically builds and deploys containerized applications.

### Step-by-Step Instructions

#### A. Using AWS Console (Web Interface)

1. **Sign in to AWS Console**
   - Go to [https://console.aws.amazon.com](https://console.aws.amazon.com)
   - Sign in with your AWS account

2. **Navigate to App Runner**
   - In the search bar at top, type "App Runner"
   - Click on "App Runner" service

3. **Create App Runner Service for Backend**
   
   a. Click "Create service"
   
   b. **Source**:
   - Repository type: Select "Source code repository" if connecting to GitHub
   - Or select "Container registry" if using pre-built images
   
   c. **Configure Source** (if using GitHub):
   - Connect to GitHub
   - Select your repository: `ZeroAct/instructor_app`
   - Branch: `main`
   - Source directory: `/` (root)
   - Deployment trigger: Automatic
   
   d. **Build Settings**:
   - Configuration file: Use existing `Dockerfile`
   - Build command: Leave default
   
   e. **Service Settings**:
   - Service name: `instructor-app-backend`
   - Virtual CPU: 1 vCPU
   - Memory: 2 GB
   - Port: 8000
   
   f. **Environment Variables**:
   - Click "Add environment variable"
   - Add: `OPENAI_API_KEY` = `your_openai_api_key`
   - Add: `ANTHROPIC_API_KEY` = `your_anthropic_api_key` (optional)
   
   g. **Review and Create**:
   - Review all settings
   - Click "Create & deploy"
   - Wait 5-10 minutes for deployment

4. **Create App Runner Service for Frontend**
   
   Repeat similar steps but with these differences:
   - Service name: `instructor-app-frontend`
   - Source directory: `/frontend`
   - Port: 3000
   - Environment Variable: 
     - `NEXT_PUBLIC_API_URL` = `https://[backend-url-from-previous-step]`
     - Get the backend URL from the backend service you just created

5. **Access Your Application**
   - App Runner will provide URLs like:
     - Backend: `https://xxxxx.us-east-1.awsapprunner.com`
     - Frontend: `https://yyyyy.us-east-1.awsapprunner.com`
   - Open the frontend URL in your browser

#### B. Using AWS CLI

```bash
# 1. Create Backend Service
aws apprunner create-service \
  --service-name instructor-app-backend \
  --source-configuration '{
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/ZeroAct/instructor_app",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "PYTHON_312",
          "BuildCommand": "pip install -e .",
          "StartCommand": "python main.py",
          "Port": "8000",
          "RuntimeEnvironmentVariables": {
            "OPENAI_API_KEY": "your_openai_api_key"
          }
        }
      }
    }
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'

# Get the backend service URL
aws apprunner describe-service --service-arn [backend-service-arn] \
  --query 'Service.ServiceUrl' --output text

# 2. Create Frontend Service (replace BACKEND_URL with actual URL)
aws apprunner create-service \
  --service-name instructor-app-frontend \
  --source-configuration '{
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/ZeroAct/instructor_app",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "NODEJS_18",
          "BuildCommand": "cd frontend && npm install && npm run build",
          "StartCommand": "cd frontend && npm start",
          "Port": "3000",
          "RuntimeEnvironmentVariables": {
            "NEXT_PUBLIC_API_URL": "https://BACKEND_URL"
          }
        }
      }
    }
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'
```

## Option 2: Amazon ECS with Fargate

**Best for**: Production applications with auto-scaling needs

Amazon ECS (Elastic Container Service) with Fargate is a serverless container orchestration service.

### Step-by-Step Instructions

1. **Install and Configure AWS CLI** (if not already done)
   ```bash
   aws configure
   ```

2. **Install ECS CLI** (optional helper tool)
   ```bash
   # macOS
   brew install amazon-ecs-cli
   
   # Linux
   sudo curl -Lo /usr/local/bin/ecs-cli https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-linux-amd64-latest
   sudo chmod +x /usr/local/bin/ecs-cli
   ```

3. **Push Docker Images to ECR** (Elastic Container Registry)
   
   ```bash
   # Get your AWS account ID
   ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   echo "Your AWS Account ID: $ACCOUNT_ID"
   
   # Create ECR repositories
   aws ecr create-repository --repository-name instructor-app-backend
   aws ecr create-repository --repository-name instructor-app-frontend
   
   # Get login credentials for ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push backend
   docker build -t instructor-app-backend .
   docker tag instructor-app-backend:latest ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/instructor-app-backend:latest
   docker push ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/instructor-app-backend:latest
   
   # Build and push frontend
   cd frontend
   docker build -t instructor-app-frontend .
   docker tag instructor-app-frontend:latest ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/instructor-app-frontend:latest
   docker push ${ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/instructor-app-frontend:latest
   ```

4. **Create ECS Task Definitions**
   
   **Important**: For security, use AWS Secrets Manager instead of plain text environment variables in production. See the [Setting up Environment Variables](#setting-up-environment-variables) section for secure configuration.
   
   Create `backend-task-definition.json` (example with plain text - use Secrets Manager in production):
   ```json
   {
     "family": "instructor-app-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/instructor-app-backend:latest",
         "portMappings": [
           {
             "containerPort": 8000,
             "protocol": "tcp"
           }
         ],
         "secrets": [
           {
             "name": "OPENAI_API_KEY",
             "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:instructor-app/openai-key"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/instructor-app-backend",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```
   
   Register the task (replace ACCOUNT_ID with your AWS account ID):
   ```bash
   # Replace ACCOUNT_ID in the JSON file first
   sed -i "s/ACCOUNT_ID/$(aws sts get-caller-identity --query Account --output text)/g" backend-task-definition.json
   
   aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
   ```

5. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name instructor-app-cluster
   ```

6. **Set up VPC and Networking** (if you don't have existing VPC)
   
   ```bash
   # Get default VPC
   VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
   
   # Get subnets in default VPC
   SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
   
   # Create security group
   SG_ID=$(aws ec2 create-security-group \
     --group-name instructor-app-sg \
     --description "Security group for Instructor App" \
     --vpc-id ${VPC_ID} \
     --query 'GroupId' --output text)
   
   # Allow inbound traffic
   aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 8000 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 3000 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 80 --cidr 0.0.0.0/0
   aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 443 --cidr 0.0.0.0/0
   
   echo "VPC: ${VPC_ID}"
   echo "Subnets: ${SUBNET_IDS}"
   echo "Security Group: ${SG_ID}"
   ```

7. **Create Application Load Balancer**
   
   Follow AWS Console:
   - Navigate to EC2 → Load Balancers
   - Create Application Load Balancer
   - Configure listeners for ports 80/443
   - Create target groups for backend (port 8000) and frontend (port 3000)

8. **Create ECS Services**
   ```bash
   # Use the values from step 6
   # Create backend service
   aws ecs create-service \
     --cluster instructor-app-cluster \
     --service-name backend-service \
     --task-definition instructor-app-backend \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}"
   
   # Create frontend service (similar command with frontend task definition)
   ```

## Option 3: EC2 with Docker

**Best for**: Users who want full control and cost optimization

Amazon EC2 (Elastic Compute Cloud) provides virtual servers in the cloud.

### Step-by-Step Instructions

1. **Launch EC2 Instance**
   
   Using AWS Console:
   - Go to EC2 Dashboard
   - Click "Launch Instance"
   - **Name**: `instructor-app-server`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: t2.medium (2 vCPU, 4 GB RAM) or t2.small for testing
   - **Key pair**: Create new key pair (download the .pem file - you'll need this!)
   - **Network settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow Custom TCP (port 8000) from anywhere
     - Allow Custom TCP (port 3000) from anywhere
   - **Storage**: 20 GB gp3
   - Click "Launch instance"

2. **Connect to EC2 Instance**
   ```bash
   # Change permission of your key file
   chmod 400 your-key.pem
   
   # Connect via SSH
   ssh -i your-key.pem ubuntu@[EC2-PUBLIC-IP]
   ```

3. **Install Docker on EC2**
   ```bash
   # Update package list
   sudo apt-get update
   
   # Install Docker
   sudo apt-get install -y docker.io docker-compose
   
   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Add ubuntu user to docker group
   sudo usermod -aG docker ubuntu
   
   # Log out and log back in for group changes to take effect
   exit
   ssh -i your-key.pem ubuntu@[EC2-PUBLIC-IP]
   ```

4. **Clone and Deploy Application**
   ```bash
   # Clone the repository
   git clone https://github.com/ZeroAct/instructor_app.git
   cd instructor_app
   
   # Create .env file with your API keys
   cat > .env << EOF
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   EOF
   
   # Start the application
   docker-compose up -d --build
   
   # Check if containers are running
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

5. **Access Your Application**
   - Frontend: `http://[EC2-PUBLIC-IP]:3000`
   - Backend: `http://[EC2-PUBLIC-IP]:8000`

6. **Optional: Set up Nginx Reverse Proxy**
   ```bash
   # Install Nginx
   sudo apt-get install -y nginx
   
   # Create Nginx configuration
   sudo tee /etc/nginx/sites-available/instructor-app << EOF
   server {
       listen 80;
       server_name [EC2-PUBLIC-IP-OR-DOMAIN];
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   
       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   EOF
   
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/instructor-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Option 4: AWS Elastic Beanstalk

**Best for**: Quick deployment of multi-container applications

AWS Elastic Beanstalk automatically handles deployment, capacity provisioning, load balancing, and auto-scaling.

### Step-by-Step Instructions

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize Elastic Beanstalk Application**
   ```bash
   cd /path/to/instructor_app
   
   # Initialize EB application
   eb init -p docker instructor-app --region us-east-1
   ```

3. **Create Environment**
   ```bash
   # Create environment and deploy
   eb create instructor-app-env
   
   # Set environment variables
   eb setenv OPENAI_API_KEY=your_openai_api_key
   eb setenv ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # Open the application
   eb open
   ```

4. **Update Application**
   ```bash
   # After making changes
   eb deploy
   ```

5. **Monitor and Manage**
   ```bash
   # View logs
   eb logs
   
   # Check status
   eb status
   
   # SSH into instance
   eb ssh
   ```

## Setting up Environment Variables

All deployment options require API keys. Here's how to set them securely:

### App Runner
- Use the console or CLI to add environment variables during service creation
- Variables are encrypted at rest

### ECS
- Use task definition environment variables
- Or use AWS Secrets Manager:
  ```bash
  # Create secret
  aws secretsmanager create-secret \
    --name instructor-app/openai-key \
    --secret-string "your_openai_api_key"
  
  # Reference in task definition
  "secrets": [
    {
      "name": "OPENAI_API_KEY",
      "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:instructor-app/openai-key"
    }
  ]
  ```

### EC2
- Use .env file (shown in EC2 section)
- Or use AWS Systems Manager Parameter Store:
  ```bash
  # Store parameter
  aws ssm put-parameter \
    --name /instructor-app/openai-api-key \
    --value "your_openai_api_key" \
    --type SecureString
  
  # Retrieve in startup script
  OPENAI_API_KEY=$(aws ssm get-parameter \
    --name /instructor-app/openai-api-key \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text)
  ```

### Elastic Beanstalk
- Use `eb setenv` command (shown above)
- Or set in the console under Configuration → Software

## Custom Domain Setup

To use your own domain (e.g., instructor-app.com):

1. **Register Domain** (if you don't have one)
   - Use AWS Route 53 or any domain registrar (GoDaddy, Namecheap, etc.)

2. **Get SSL Certificate**
   - Use AWS Certificate Manager (ACM) - it's free!
   - Request certificate for your domain
   - Verify domain ownership (email or DNS)

3. **Configure DNS**
   - Create A record pointing to your Load Balancer (for ECS)
   - Or create CNAME record pointing to your App Runner/EB URL
   
   Example Route 53 setup:
   ```
   Type: A
   Name: instructor-app.com
   Value: [Load-Balancer-DNS-Name]
   Alias: Yes
   ```

4. **Configure HTTPS**
   - For App Runner: Add custom domain in console
   - For ALB (ECS): Add HTTPS listener with ACM certificate
   - For EC2: Use Certbot to get Let's Encrypt certificate

## Cost Estimation

Monthly cost estimates (approximate, verify current pricing at [https://aws.amazon.com/pricing](https://aws.amazon.com/pricing)):

**Note**: These estimates are subject to change. Always check current AWS pricing and use the [AWS Pricing Calculator](https://calculator.aws) for accurate estimates.

### App Runner
- 1 vCPU, 2 GB RAM, running 24/7
- ~$40-60/month per service
- Total: ~$80-120/month (backend + frontend)

### ECS Fargate
- 2 tasks (0.5 vCPU, 1 GB each), running 24/7
- ~$30-50/month
- Plus Load Balancer: ~$16/month
- Total: ~$46-66/month

### EC2
- t2.medium instance (2 vCPU, 4 GB), running 24/7
- ~$34/month
- Plus 20 GB storage: ~$2/month
- Total: ~$36/month

### Elastic Beanstalk
- Similar to EC2 + Load Balancer
- ~$50-70/month

**Free Tier Benefits** (first 12 months):
- EC2: 750 hours/month of t2.micro (1 vCPU, 1 GB)
- App Runner: 2,000 build minutes, 4 GB memory/month
- Data transfer: 100 GB/month out to internet

**Cost Optimization Tips**:
1. Use t3 instances instead of t2 for better price/performance
2. Stop/terminate resources when not in use
3. Use Reserved Instances for long-term deployments (up to 72% savings)
4. Monitor usage with AWS Cost Explorer

## Troubleshooting

### Application Won't Start

**Problem**: Container exits immediately after starting

**Solutions**:
```bash
# Check logs
aws apprunner describe-service --service-arn [arn] | grep -A 10 logs

# For ECS
aws ecs describe-tasks --cluster [cluster] --tasks [task-arn]
aws logs tail /ecs/instructor-app-backend --follow

# For EC2
docker-compose logs
```

**Common issues**:
- Missing environment variables
- Port already in use
- Insufficient memory

### Can't Connect to Application

**Problem**: Timeout or connection refused

**Solutions**:
1. Check security groups (EC2/ECS):
   - Ensure inbound rules allow ports 80, 443, 3000, 8000
   - From source: 0.0.0.0/0 (or your IP)

2. Check network configuration:
   - Ensure public IP is assigned (for EC2)
   - Ensure subnets are public (for ECS)

3. Check application health:
   ```bash
   curl http://localhost:8000/health
   ```

### Frontend Can't Connect to Backend

**Problem**: Frontend shows connection errors

**Solutions**:
1. Check `NEXT_PUBLIC_API_URL` environment variable
   - Must be the public URL of backend
   - Include protocol (http:// or https://)

2. Check CORS settings in backend
   - FastAPI should allow frontend origin

3. Update frontend environment variable:
   ```bash
   # App Runner
   aws apprunner update-service --service-arn [arn] \
     --source-configuration '[...]' \
     # Update NEXT_PUBLIC_API_URL
   
   # EC2
   # Edit .env file and restart containers
   docker-compose restart
   ```

### High Costs

**Problem**: AWS bill is higher than expected

**Solutions**:
1. Check Cost Explorer in AWS Console
2. Stop unused resources:
   ```bash
   # Stop EC2 instance
   aws ec2 stop-instances --instance-ids i-xxx
   
   # Delete App Runner service
   aws apprunner delete-service --service-arn [arn]
   
   # Stop ECS service
   aws ecs update-service --cluster [cluster] --service [service] --desired-count 0
   ```

3. Set up billing alerts:
   - Go to AWS Billing Dashboard
   - Create budget alert (e.g., alert when costs exceed $50/month)

### Database/Storage Issues

**Problem**: Need persistent storage for data

**Solutions**:
This app uses browser localStorage, but if you need persistent storage:

1. **Add RDS Database**:
   ```bash
   # Create PostgreSQL database
   aws rds create-db-instance \
     --db-instance-identifier instructor-app-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password [password] \
     --allocated-storage 20
   ```

2. **Add S3 Bucket** for file storage:
   ```bash
   aws s3 mb s3://instructor-app-storage
   ```

## Getting Help

- **AWS Support**: Available in AWS Console (Basic plan is free)
- **AWS Documentation**: [https://docs.aws.amazon.com](https://docs.aws.amazon.com)
- **AWS Forums**: [https://forums.aws.amazon.com](https://forums.aws.amazon.com)
- **Instructor App Issues**: [https://github.com/ZeroAct/instructor_app/issues](https://github.com/ZeroAct/instructor_app/issues)

## Next Steps

After deploying:

1. **Set up monitoring**:
   - Use AWS CloudWatch for logs and metrics
   - Set up alerts for errors and high usage

2. **Enable auto-scaling** (for ECS):
   - Scale based on CPU/memory usage
   - Handle traffic spikes automatically

3. **Set up CI/CD**:
   - Use GitHub Actions to automatically deploy on push
   - Example workflow provided below

4. **Backup strategy**:
   - If using RDS, enable automated backups
   - Snapshot EC2 instances regularly

## Example GitHub Actions CI/CD

Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: instructor-app-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster instructor-app-cluster \
            --service backend-service \
            --force-new-deployment
```

## Summary

You now have four options to deploy Instructor App to AWS:

1. **Start with App Runner** if you're new to AWS - it's the easiest
2. **Use ECS** if you need production-grade deployment with auto-scaling
3. **Use EC2** if you want full control and cost optimization
4. **Use Elastic Beanstalk** for quick multi-container deployment

Each option has trade-offs between ease of use, cost, and control. Choose based on your needs and experience level.

Happy deploying! 🚀
