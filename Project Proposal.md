# ECE1779_Final_Project
Wasilat Ayinla - 1013902948

Siddharth Joshi - 1012878986

Sree Mukund Vegi - 1006832741

Jeslyn Wang - 1007915838
# Motivation

### The Problem

Discovering and keeping track of restaurants can be overwhelming, especially in Toronto where there is seemingly a different restaurant around every corner. While existing platforms have taken their own approaches to addressing this issue, they leave a gap for a socially-driven and personalized experience. 

For example, [Google Maps](https://support.google.com/maps/answer/4610185/?co=GENIE.Platform=Desktop&utm) provides extensive information about restaurants including ratings, reviews, photos, etc., but its approach to restaurant discovery primarily uses a location-based search and doesn’t take into account personal taste or shared interest with a user’s social circle. Another example is [Beli](https://beliapp.com/), which uses a much more personalized experience through user rankings and social recommendations but it uses an ELO-style ranking to compare restaurants even if they are from different cuisines and price ranges. 

Given the current climate of the restaurant discovery problem, the team believes there is an opportunity to develop a service that addresses this through a social-first lens, allowing people to engage with the rest of their community while finding where to eat next. 

### Intended Users

Our primary target users are Toronto residents who enjoy exploring new restaurants, sharing dining experiences, and discovering places through recommendations from people with similar interests.

### Significance

Eating is inherently a social activity. From sitting down with your family at dinner to going to a restaurant to celebrate a milestone, the act of eating good food encompasses a large part of our social experiences. However, opportunities to share these experiences and discover new places together are increasingly mediated by fragmented online platforms. 

We believe restaurant discovery can be more engaging when it is treated as a social experience rather than simply a search for the highest-rated establishment. By making it easier to document dining experiences, share opinions with friends, and discover restaurants through community recommendations, our platform aims to extend the social aspect of dining beyond the restaurant itself.

Additionally, a community-driven discovery platform can help increase visibility for local Toronto restaurants and help users make more informed dining decisions.

# Objectives, Architecture, and Key Features
### Objectives and core functionality
The main objective is to design, develop, and deploy a cloud-hosted food discovery and rating website. The application will support:
- User registration, login, and basic profile management.
- Restaurant listings and detail pages.
- Search or filtering by attributes such as restaurant name, cuisine, or location.
- User-submitted ratings and written reviews.
- Display of restaurant rating summaries and community feedback.

The project will also demonstrate containerization, persistent storage, cloud deployment, orchestration, automated delivery, scaling, and monitoring.

### Proposed Architecture and Technologies
The frontend will be developed with React and served in production by Nginx. The backend will use Node.js and Express to expose REST API endpoints, validate requests, apply application logic, and communicate with the database. PostgreSQL will store users, restaurants, ratings, and reviews. A relational database is appropriate because these entities have structured relationships; using one database also avoids the extra overhead of maintaining multiple database technologies.

The frontend and backend will be packaged as separate Docker images. Docker Compose will run the frontend, backend, and PostgreSQL together during local development. A named volume will preserve local database data when containers are stopped or recreated. Compose is intended for local development and integration testing, not production orchestration.

For cloud deployment, the team will use DigitalOcean infrastructure and DigitalOcean Kubernetes (DOKS) for container orchestration. DigitalOcean was selected over alternatives such as Fly.io because it provides greater control over underlying infrastructure and an integrated ecosystem of services, including Droplets, Block Storage, Container Registry, and Load Balancers.

Kubernetes was selected over Docker Swarm because it offers more advanced orchestration capabilities, including workload management, service discovery, and scaling. DOKS also provides a managed Kubernetes environment, allowing the team to focus on application deployment without independently maintaining the control plane.

The React/Nginx frontend and Express API will run as separate Kubernetes Deployments, exposed through Kubernetes Services. A DigitalOcean Load Balancer will serve as the public entry point and distribute incoming traffic across healthy Kubernetes worker nodes (Droplets). The NGINX Ingress Controller, running within the Kubernetes cluster, will then handle application-level HTTP routing by directing requests to the appropriate Kubernetes Service based on URL paths—for example, routing requests to `/` to the frontend and `/api` to the backend. The frontend and backend will be managed through separate Kubernetes Deployments, allowing each component to be updated and scaled independently.

PostgreSQL will be deployed within the DOKS cluster, using DigitalOcean Block Storage for persistent data storage. A PersistentVolumeClaim (PVC) will ensure database records survive Pod restarts, recreation, and rescheduling. The team will also implement backup and recovery procedures to protect against data loss.

DigitalOcean Container Registry (DOCR) will store versioned Docker images for Kubernetes to retrieve during deployment. Database credentials and API keys will be securely managed through Kubernetes Secrets and GitHub Actions secrets rather than committed to source control.

### Course Technologies, Monitoring, and Observability

**Docker and Docker Compose:** Dockerfiles will package the frontend and backend, while Docker Compose will coordinate local development and integration testing across application services.

**PostgreSQL and Persistent Storage:** PostgreSQL will store application data, with Docker volumes supporting local persistence and DigitalOcean Block Storage providing persistent production storage through Kubernetes PersistentVolumeClaims.

**DigitalOcean and Kubernetes:** DOKS will orchestrate production workloads using Deployments, Pods, Services, and Ingress. ConfigMaps and Secrets will manage application configuration and sensitive credentials.

**Monitoring and Observability:** The team will monitor Pod health, restarts, CPU and memory utilization, and resource consumption using Kubernetes tools and DigitalOcean monitoring. Container logs will be inspected using `kubectl logs`, while readiness and liveness probes will help identify unhealthy workloads and manage application availability.

### Advanced Features We Plan to Integrate

**CI/CD using GitHub Actions:** GitHub Actions will automate testing, building, and deployment. Workflows will run on designated pushes and pull requests, build and tag frontend and backend Docker images, and push them to DOCR. Successful checks will trigger Kubernetes deployments and rollout verification. This improves deployment consistency, reduces manual work, and supports version tracking and rollbacks. Credentials will be stored as GitHub Actions secrets.

**Authentication with Firebase Authentication:** Firebase Authentication will provide user registration and login without requiring the team to implement its own authentication system. The React frontend will use the Firebase SDK, while the Express backend will verify Firebase ID tokens before allowing access to protected features, such as submitting reviews, ratings, and following other users. PostgreSQL will store application-specific user and activity data rather than authentication credentials.

**External API Integration and Serverless Functions:** Google Places API will be used to initially populate the restaurant database with information such as names, addresses, and locations, complementing user-generated ratings and reviews. SendGrid will deliver email notifications for events such as receiving a new follower. DigitalOcean Functions will handle notification tasks independently of the main backend, reducing processing overhead and supporting event-driven workloads. API credentials will be securely managed through environment variables and appropriate secrets.
### System Diagram
The system diagram illustrates the deployment of a containerized, full-stack restaurant rating application on a DigitalOcean Kubernetes cluster, comprising React frontend replicas, Node.js backend replicas, and PostgreSQL for persistent data storage.

![Logo](https://github.com/jeslyn-wang/ECE1779_Final_Project/blob/main/Architecture.png)

### Database Schema Design
The diagram illustrates the PostgreSQL database schema and relationships between four core entities: Users, Restaurants, Reviews, and Follows. Primary keys uniquely identify each record, while foreign keys establish relationships between users and their reviews, restaurants and their reviews, and users following one another, supporting the application's rating and social networking functionality.
![Logo](https://github.com/jeslyn-wang/ECE1779_Final_Project/blob/main/Schema.png)


### Scope, feasibility, and risks
The minimum viable product is limited to authentication, restaurant listings and details, ratings, reviews, PostgreSQL, and a working cloud deployment. The team will prioritize a complete end-to-end user flow before optional features. This is feasible because it uses a conventional web architecture and a small number of deployable components.

Key risks include cloud costs, Kubernetes configuration, database connectivity, and integration delays. The team will check pricing before provisioning resources, agree on API contracts and environment-variable names early, use Compose for local integration, and deploy a basic version to DOKS before adding advanced features. 

# Project Plan and Team Responsibilities

### Development Plan

The team will follow an iterative development approach, with tasks divided across frontend development, backend implementation, database integration, and cloud deployment.

| Timeline | Tasks |
|---|---|
| Nov 5–7 | Finalize proposal, architecture, project scope, and responsibilities. |
| Nov 8–11 | Set up GitHub repository, Docker Compose environment, PostgreSQL schema, and API contracts. |
| Nov 12–17 | Develop frontend, backend APIs, authentication, restaurant listings, search, ratings, and reviews. |
| Nov 18–20 | Integrate frontend and backend, database functionality, and Google Places API. |
| Nov 21–24 | Deploy to DigitalOcean Kubernetes (DOKS), configure Block Storage PVCs, and implement monitoring. |
| Nov 25–Dec 4 | Complete CI/CD, test advanced features, resolve issues, and prepare documentation and presentation materials. |

### Team Responsibilities

The proposed division of responsibilities is:

| Team Member | Responsibilities |
|---|---|
| Jeslyn | Architecture Design, Motivation, Docker, Kubernetes deployment, DigitalOcean infrastructure, persistent storage, and monitoring. |
| Joshi | Architecture Design, Node.js/Express backend, REST APIs, application logic, and database integration. |
| Wasilat | Architecture Design, User requirements, frontend development, and UI design. |
| Sree | Project planning and coordination, initial restaurant data and external API exploration, AI-assisted research, and integration/documentation support. |

Responsibilities may overlap as needed during integration and testing.

### Collaboration and Risk Management

The team will use GitHub for version control, with separate branches and pull requests to track contributions and review changes. API contracts, database schemas, and environment configurations will be agreed upon early to reduce integration issues.

Key risks include cloud infrastructure costs, Kubernetes configuration complexity, Google Places API quotas, and integration delays. These will be addressed through early testing, cost monitoring, and incremental deployment.

# Initial Team Reasoning and AI-Assisted Exploration

### Initial Reasoning

The team identified an opportunity to build a social restaurant discovery platform focused on Toronto. The initial concept combined restaurant search and ratings with community-driven recommendations.

Early discussions considered:
- Building a web application rather than a mobile application to keep development manageable.
- Using PostgreSQL to manage users, restaurants, reviews, follows, and collections.
- Using Docker and cloud infrastructure to support deployment and scalability.
- Collecting information for approximately 200–300 Toronto restaurants through external data sources.
- Comparing DigitalOcean and Fly.io, and evaluating Docker Swarm versus Kubernetes.
- Determining how to implement persistent storage and select suitable advanced features.

### AI-Assisted Exploration

AI tools were used to compare deployment platforms and identify potential implementation challenges. The team considered the trade-offs between DigitalOcean and Fly.io, as well as Docker Swarm and Kubernetes. These discussions helped inform the decision to use DigitalOcean Kubernetes (DOKS). AI-assisted exploration also helped the team investigate potential deployment, integration, and cost-related challenges.

The team evaluated these suggestions against the course requirements, project timeline, and available resources before incorporating them into the proposed architecture. AI was used as a research and planning aid; final technical decisions remain the responsibility of the team.