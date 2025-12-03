# Deployment Guide for DDG Web Search

This guide provides step-by-step instructions for deploying the DDG Web Search application using Docker in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Deployment](#local-deployment)
- [Production Deployment](#production-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling](#scaling)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- Git (for cloning the repository)

### Optional Tools

- Make (for using Makefile commands)
- kubectl (for Kubernetes deployment)
- helm (for Kubernetes package management)

### System Requirements

**Minimum:**

- 2 CPU cores
- 512MB RAM
- 1GB disk space

**Recommended:**

- 4 CPU cores
- 1GB RAM
- 2GB disk space

## Quick Start

### Option 1: Using the Quick Start Script

```bash
# Make the script executable (if not already)
chmod +x docker-start.sh

# Run the interactive script
./docker-start.sh
```

### Option 2: Using npm Scripts

```bash
# Build Docker image
npm run docker:build

# Run HTTP server
npm run docker:run:http

# Or use Docker Compose
npm run docker:compose:http
```

### Option 3: Using Make

```bash
# Build and run
make quick-start-http

# Or for development
make quick-start-dev
```

## Local Deployment

### Development Environment

For local development with hot-reload:

```bash
# Using Docker Compose
docker-compose -f docker-compose.dev.yml up

# Or using Make
make compose-dev

# Or using npm
npm run docker:compose:dev
```

This will:

- Start the development server
- Mount source code for hot-reload
- Expose debugger on port 9229
- Expose HTTP server on port 3001

### Testing Locally

```bash
# Run the test suite
./docker-test.sh

# Or using npm
npm run docker:test

# Or using Docker Compose
docker-compose -f docker-compose.dev.yml --profile test up
```

## Production Deployment

### Single Server Deployment

#### Step 1: Build the Production Image

```bash
docker build -t ddg-web-search:latest .
```

#### Step 2: Run with Docker Compose

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Step 3: Configure Environment

Create a `.env` file (based on `.env.example`):

```bash
# Copy example file
cp .env.example .env

# Edit with your settings
nano .env
```

#### Step 4: Test the Deployment

```bash
# Test HTTP endpoint
curl http://localhost:3001/

# Run health check
curl http://localhost:3001/health
```

### Multi-Server Deployment

For deploying across multiple servers:

#### Using Docker Swarm

```bash
# Initialize Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml ddg-stack

# Scale the service
docker service scale ddg-stack_ddg-mcp-http-prod=3

# Check services
docker service ls

# Remove stack
docker stack rm ddg-stack
```

## Cloud Deployment

### AWS Deployment

#### Using EC2

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - Instance type: t3.small or larger
   - Open port 3001 in security group

2. **Install Docker**

```bash
# For Amazon Linux 2
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Deploy Application**

```bash
# Clone repository
git clone <repository-url>
cd ddg-web-search

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

#### Using ECS

Create an ECS task definition:

```json
{
  "family": "ddg-web-search",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "ddg-mcp-server",
      "image": "your-registry/ddg-web-search:latest",
      "memory": 512,
      "cpu": 256,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/ddg-web-search

# Deploy to Cloud Run
gcloud run deploy ddg-web-search \
  --image gcr.io/PROJECT_ID/ddg-web-search \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001
```

### Azure Deployment

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name ddg-rg --location eastus

# Create container instance
az container create \
  --resource-group ddg-rg \
  --name ddg-web-search \
  --image your-registry/ddg-web-search:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3001 \
  --environment-variables NODE_ENV=production
```

## Kubernetes Deployment

### Creating Kubernetes Manifests

#### Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ddg-web-search
  labels:
    app: ddg-web-search
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ddg-web-search
  template:
    metadata:
      labels:
        app: ddg-web-search
    spec:
      containers:
        - name: ddg-mcp-server
          image: ddg-web-search:latest
          args:
            - node
            - dist/mcp.js
            - --transport
            - http
            - --port
            - "3001"
            - --host
            - "0.0.0.0"
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: production
            - name: PUPPETEER_EXECUTABLE_PATH
              value: /usr/bin/chromium-browser
          resources:
            limits:
              cpu: "1"
              memory: 512Mi
            requests:
              cpu: "0.5"
              memory: 256Mi
          livenessProbe:
            httpGet:
              path: /
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Service

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ddg-web-search
spec:
  type: LoadBalancer
  selector:
    app: ddg-web-search
  ports:
    - port: 80
      targetPort: 3001
      protocol: TCP
```

#### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -l app=ddg-web-search

# Scale deployment
kubectl scale deployment ddg-web-search --replicas=5
```

### Using Helm

Create a Helm chart for easier management:

```bash
# Create chart
helm create ddg-web-search-chart

# Install chart
helm install ddg-web-search ./ddg-web-search-chart

# Upgrade
helm upgrade ddg-web-search ./ddg-web-search-chart

# Uninstall
helm uninstall ddg-web-search
```

## Monitoring and Logging

### Prometheus and Grafana

Enable monitoring using the production compose file:

```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

### Centralized Logging

#### Using ELK Stack

Add to `docker-compose.prod.yml`:

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

logstash:
  image: docker.elastic.co/logstash/logstash:8.11.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  depends_on:
    - elasticsearch

kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch
```

### Health Checks

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' ddg-mcp-http

# Continuous health monitoring
watch -n 5 'docker inspect --format="{{.State.Health.Status}}" ddg-mcp-http'
```

## Scaling

### Horizontal Scaling

#### Using Docker Compose

```bash
# Scale to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale ddg-mcp-http-prod=3
```

#### Using Kubernetes

```bash
# Scale deployment
kubectl scale deployment ddg-web-search --replicas=5

# Auto-scaling
kubectl autoscale deployment ddg-web-search --min=2 --max=10 --cpu-percent=80
```

### Load Balancing

Use nginx as reverse proxy (included in prod compose with `--profile with-nginx`):

```bash
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

## Security

### Best Practices

1. **Use Non-Root User** ✓ (Already implemented)
2. **Keep Images Updated** - Regularly rebuild with latest base images
3. **Scan for Vulnerabilities** - Use `docker scan` or Trivy
4. **Use Secrets Management** - For sensitive configuration
5. **Enable TLS** - Use HTTPS in production

### Scanning Images

```bash
# Using Docker scan
docker scan ddg-web-search:latest

# Using Trivy
trivy image ddg-web-search:latest
```

### Secrets Management

Use Docker secrets or Kubernetes secrets:

```bash
# Create secret
echo "my-secret-value" | docker secret create my_secret -

# Use in service
docker service create \
  --name ddg-web-search \
  --secret my_secret \
  ddg-web-search:latest
```

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs
docker logs ddg-mcp-http

# Check events
docker events

# Inspect container
docker inspect ddg-mcp-http
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Use different port
docker run -p 3002:3001 ddg-web-search
```

#### Performance Issues

```bash
# Monitor resources
docker stats

# Increase memory limit
docker run --memory=1g ddg-web-search

# Check container processes
docker top ddg-mcp-http
```

#### Network Issues

```bash
# Check networks
docker network ls
docker network inspect ddg-prod-network

# Test connectivity
docker run --network container:ddg-mcp-http curlimages/curl curl localhost:3001
```

### Getting Help

1. Check logs: `docker logs -f <container-name>`
2. Run tests: `./docker-test.sh`
3. Inspect container: `docker inspect <container-name>`
4. Check [DOCKER.md](./DOCKER.md) for detailed documentation
5. Open an issue on GitHub

## Rollback Procedures

### Quick Rollback

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Using Kubernetes
kubectl rollout undo deployment/ddg-web-search
```

### Versioned Rollback

```bash
# Tag current version
docker tag ddg-web-search:latest ddg-web-search:v1.0.0

# Deploy specific version
docker run -p 3001:3001 ddg-web-search:v1.0.0
```

## Backup and Recovery

### Backup Configuration

```bash
# Backup volumes
docker run --rm -v ddg-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

### Recovery

```bash
# Restore volumes
docker run --rm -v ddg-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

## CI/CD Integration

The project includes GitHub Actions workflow for automated builds. See `.github/workflows/docker.yml`.

### GitLab CI Example

```yaml
build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [DOCKER.md](./DOCKER.md) - Comprehensive Docker guide
- [README.md](./README.md) - Project documentation
