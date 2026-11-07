### System Architecture

![System architecture](https://raw.githubusercontent.com/<org>/<repo>/main/docs/architecture.png)

The application is a web app made of three components, a Next.js frontend, a FastAPI backend, and a PostgreSQL database, all running on a DigitalOcean Kubernetes (DOKS) cluster. Each component is packaged as a Docker image and runs as its own Kubernetes workload, so the components can be deployed, scaled, and restarted independently.

**Request flow.** A user's browser connects over HTTPS to a DigitalOcean Load Balancer, which forwards traffic to an Ingress controller in the cluster. The Ingress routes `/api/*` to the FastAPI Service and all other paths to the Next.js Service. The frontend gets its data only through the API, and the API is the only component that talks to the database. Keeping the database behind a single component means business rules, such as one review per user per restaurant, are enforced in one place.

**Data model.** PostgreSQL stores `users`, `restaurants`, `reviews`, `follows`, `collections`, and a `collection_items` join table, since a collection holds many restaurants and a restaurant can appear in many collections. The `restaurants` table is seeded once with a few hundred Toronto restaurants from OpenStreetMap; each row keeps its OpenStreetMap ID as a unique key, so re-running the seed job never creates duplicates. Schema changes are applied through versioned migrations.

### Use of Required Technologies

**Docker and Docker Compose.** The frontend, the API, and the seed job each have a Dockerfile, and PostgreSQL uses the official image. For local development, `docker-compose.yml` runs the whole stack with a named volume for the database. The same images are later deployed to the cluster, so behaviour tested locally matches production.

**PostgreSQL and persistent storage.** PostgreSQL runs as a single-replica StatefulSet. Its PersistentVolumeClaim uses DigitalOcean's `do-block-storage` StorageClass, which provisions a DigitalOcean Volume and attaches it to the node running the database pod. If the pod crashes or is rescheduled, Kubernetes mounts the same volume into the replacement pod and the data is preserved. We will demonstrate this by deleting the database pod and showing that existing reviews are still there.

**Deployment provider: DigitalOcean.** We chose DigitalOcean over Fly.io. Fly.io is strongest at multi-region edge deployment, which a Toronto-only app does not need, and it supports Kubernetes only through a paid beta. DigitalOcean offers managed Kubernetes, block storage, a container registry, serverless functions, and monitoring from one provider.

**Orchestration: Kubernetes.** We chose Kubernetes over Docker Swarm. Swarm is simpler and load-balances across a fixed set of nodes, but it cannot scale workloads automatically based on load. Kubernetes provides the Horizontal Pod Autoscaler and integrates directly with DigitalOcean load balancers and volumes. We will develop the manifests on minikube and then apply them to DOKS. The manifests include Deployments for the frontend and API, ClusterIP Services, the PostgreSQL StatefulSet and PVC, Secrets for credentials, and readiness and liveness probes on a FastAPI `/health` endpoint.

**Monitoring and observability.** DigitalOcean's cluster dashboards track node CPU, memory, and disk. Alert policies email the team when CPU stays above 80% for five minutes or memory or disk usage passes 85%. Inside the cluster, `kubectl top`, HPA events, and pod logs show per-pod usage and scaling decisions.

### How the Advanced Features Fit In

- **Auto-scaling.** An HPA scales the API from 2 to 5 pods at a 70% CPU target. The API scales because it handles all reads and writes. The frontend stays at 2 pods, and the database stays at 1.
- **CI/CD.** GitHub Actions runs tests on every pull request. On merge to `main`, it builds images tagged with the commit SHA, pushes them to DigitalOcean Container Registry, and triggers a rolling update on DOKS. Readiness probes stop traffic from reaching new pods until they are healthy.
- **Serverless functions and external service integration.** When a user gets a new follower, or someone they follow posts a review, the API sends an asynchronous event to a DigitalOcean Function, which emails the user through SendGrid. Running email outside the cluster keeps slow, bursty work off the API pods and keeps the SendGrid key out of the cluster.

### Key Design Tradeoffs

- **Single database replica.** Block volumes attach to one node at a time, so PostgreSQL runs as one pod and only the stateless tiers are replicated. If a node fails, there is a short outage while the volume reattaches to another node, but no data is lost. We judged highly available PostgreSQL with replication to be too complex for this project.
- **Connection limits under scaling.** Each API pod has its own database connection pool. We will size the pools so that five pods stay under PostgreSQL's connection limit, and our load test will check whether the database becomes the bottleneck before the API does.
- **Best-effort notifications.** If the email function fails, the user's action still succeeds and the failure is logged. Notifications are a convenience, so they should never block a core action.
