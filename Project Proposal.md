# ECE1779_Final_Project

# Motivation

## The Problem

Discovering and keeping track of restaurants can be overwhelming, especially in Toronto where there is seemingly a different restaurant around every corner. While existing platforms have taken their own approaches to addressing this issue, they leave a gap for a socially-driven and personalized experience. 

For example, [Google Maps](https://support.google.com/maps/answer/4610185/?co=GENIE.Platform=Desktop&utm) provides extensive information about restaurants including ratings, reviews, photos, etc., but its approach to restaurant discovery primarily uses a location-based search and doesn’t take into account personal taste or shared interest with a user’s social circle. Another example is [Beli](https://beliapp.com/), which uses a much more personalized experience through user rankings and social recommendations but it uses an ELO-style ranking to compare restaurants even if they are from different cuisines and price ranges. 

Given the current climate of the restaurant discovery problem, the team believes there is an opportunity to develop a service that addresses this through a social-first lens, allowing people to engage with the rest of their community while finding where to eat next. 

## Intended Users

Our primary target users are Toronto residents who enjoy exploring new restaurants, sharing dining experiences, and discovering places through recommendations from people with similar interests.

## Significance

Eating is inherently a social activity. From sitting down with your family at dinner to going to a restaurant to celebrate a milestone, the act of eating good food encompasses a large part of our social experiences. However, opportunities to share these experiences and discover new places together are increasingly mediated by fragmented online platforms. 

We believe restaurant discovery can be more engaging when it is treated as a social experience rather than simply a search for the highest-rated establishment. By making it easier to document dining experiences, share opinions with friends, and discover restaurants through community recommendations, our platform aims to extend the social aspect of dining beyond the restaurant itself.

Additionally, a community-driven discovery platform can help increase visibility for local Toronto restaurants and help users make more informed dining decisions.
# Objectives and core functionality
The main objective is to design, develop, and deploy a cloud-hosted food discovery and rating website. The initial application will support:
 User registration, login, and basic profile management.
 Restaurant listings and detail pages.
 Search or filtering by attributes such as restaurant name, cuisine, or location.
 User-submitted ratings and written reviews.
 Display of restaurant rating summaries and community feedback.
The project will also demonstrate containerization, persistent storage, cloud deployment, orchestration, automated delivery, scaling, and monitoring.

# Proposed Architecture and Technologies
The frontend will be developed with React and served in production by Nginx. The backend will use Node.js and Express to expose REST API endpoints, validate requests, apply application logic, and communicate with the database. PostgreSQL will store users, restaurants, ratings, and reviews. A relational database is appropriate because these entities have structured relationships; using one database also avoids the extra overhead of maintaining multiple database technologies.

The frontend and backend will be packaged as separate Docker images. Docker Compose will run the frontend, backend, and PostgreSQL together during local development. A named volume will preserve local database data when containers are stopped or recreated. Compose is intended for local development and integration testing, not production orchestration.

For cloud deployment the team will use DigitalOcean infrastructure and DigitalOcean Kubernetes (DOKS) for orchestration. The React/Nginx frontend and Express API will run as separate Kubernetes Deployments, exposed through Kubernetes Services. A DigitalOcean Load Balancer will serve as the public entry point and distribute incoming traffic across healthy Kubernetes worker nodes (Droplets). The NGINX Ingress Controller, running within the Kubernetes cluster, will then handle application-level HTTP routing by directing requests to the appropriate Kubernetes Service based on URL paths—for example, routing requests to `/` to the frontend and `/api` to the backend. The frontend and backend will be managed through separate Kubernetes Deployments, allowing each component to be updated and scaled independently.

The production database will use PostgreSQL deployed within the DigitalOcean Kubernetes (DOKS) cluster, with DigitalOcean Block Storage providing persistent data storage. A PersistentVolumeClaim (PVC) will be configured to provision and request persistent storage for the PostgreSQL Pod, ensuring that database records remain intact even if the Pod is restarted, recreated, or rescheduled. This approach separates database storage from the lifecycle of individual containers, allowing the database to recover its existing data when a new Pod is created. The team will also implement appropriate database backup and recovery procedures to protect against data loss.
DigitalOcean Container Registry (DOCR) will store versioned Docker images. Kubernetes will retrieve these images during deployment. Database credentials and API keys will be stored in Kubernetes Secrets or appropriate repository secrets, not committed to source control.

# Course technologies, monitoring, and observability
Docker and Docker Compose: Separate Dockerfiles will package the frontend and backend. Compose will define the local services, networking, environment configuration, and persistent database volume.

PostgreSQL and persistent storage: PostgreSQL will hold application records. Production data will use managed persistent database storage and an appropriate backup configuration.

DigitalOcean and Kubernetes: DigitalOcean will run the application workloads. Deployments, Pods, Services, Ingress, ConfigMaps, and Secrets will manage execution, networking, and configuration. Kubernetes is selected over Docker Swarm because DOKS provides a managed Kubernetes environment and supports the project's orchestration and scaling goals. Kubernetes has a steeper learning curve, so the team will keep the architecture small.

Monitoring and observability: The team will inspect pod status, restarts, CPU and memory usage, and resource consumption using Kubernetes tools and DigitalOcean monitoring/metrics where available. Container logs will be reviewed through kubectl logs. Readiness and liveness probes will help determine whether containers are ready to receive traffic or need restarting. 
# Advanced features we plan to Integrate 
CI/CD using GitHub Actions. A workflow will run on agreed pushes and pull requests. It will run available tests and build checks, build frontend and backend Docker images, tag them with a version or commit identifier, and push them to DOCR. After checks pass, the workflow will update the Kubernetes Deployments and verify rollout status. This makes deployment repeatable and reduces manual steps. Credentials will be stored as GitHub Actions secrets.

Firebase Authentication will be integrated to provide secure user registration and login. Users will be able to create accounts and sign in before accessing protected features such as submitting restaurant ratings and reviews. The React frontend will use the Firebase Authentication SDK, while the Node.js/Express backend will verify Firebase ID tokens before processing authenticated requests. This avoids the need to manage user passwords directly within the application.

The application will also integrate an external service API, such as SendGrid, to send email notifications to users upon certain events like a new follower. DigitalOcean Functions will provide a serverless execution environment for handling notification-related tasks, allowing them to run independently of the main application backend. We will also use Google Places API, to perform a one-time retrieval restaurant-related information, including addresses, locations and place details. This will enrich the restaurant discovery experience by combining external restaurant information with user-generated ratings and reviews stored in PostgreSQL. API credentials will be managed securely through environment variables or Kubernetes Secrets.

## System Diagram
The system diagram illustrates the deployment of a containerized, full-stack restaurant rating application on a DigitalOcean Kubernetes cluster, comprising Next.js frontend replicas, FastAPI backend replicas, and PostgreSQL for persistent data storage. It also integrates supporting cloud services, including a DigitalOcean Load Balancer, container registry, block storage, monitoring, serverless functions, and GitHub Actions for automated CI/CD.
![Logo](https://github.com/jeslyn-wang/ECE1779_Final_Project/blob/main/Architecture.png)

## Database Schema Design
The diagram illustrates the PostgreSQL database schema and relationships between four core entities: Users, Restaurants, Reviews, and Follows. Primary keys uniquely identify each record, while foreign keys establish relationships between users and their reviews, restaurants and their reviews, and users following one another, supporting the application's rating and social networking functionality.
![Logo](https://github.com/jeslyn-wang/ECE1779_Final_Project/blob/main/Schema.png)


# Scope, feasibility, and risks
The minimum viable product is limited to authentication, restaurant listings and details, ratings, reviews, PostgreSQL, and a working cloud deployment. The team will prioritize a complete end-to-end user flow before optional features. This is feasible because it uses a conventional web architecture and a small number of deployable components.

Key risks include cloud costs, Kubernetes configuration, database connectivity, and integration delays. The team will check pricing before provisioning resources, agree on API contracts and environment-variable names early, use Compose for local integration, and deploy a basic version to DOKS before adding advanced features. 
