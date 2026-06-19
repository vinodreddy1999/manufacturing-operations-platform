# Deployment Report - 2026-06-13

## Summary

- Repository: `https://github.com/vinodreddy1999/manufacturing-operations-platform.git`
- Branch: `main`
- Source commit before deployment: `bf1f927`
- Application: `Metam Services`
- Docker image: `vinodreddy1999/manufacturing-operations-platform-fullstack`
- Tags: `latest`, `0.2.2`
- Deployment environment: Local Docker Desktop Linux engine
- Runtime container: `mop-fullstack-validation`
- Application URL: `http://127.0.0.1:8080`

## Identified Context

- Backend version in `app/main.py`: `0.2.2`
- Enterprise info version in `app/enterprise.py`: `0.2.2`
- Dockerfile: multi-stage Node frontend build plus Python 3.12 FastAPI runtime
- Persistent data volume: `mop_fullstack_data:/data`

## Build Evidence

Command:

```bash
docker build -t vinodreddy1999/manufacturing-operations-platform-fullstack:latest -t vinodreddy1999/manufacturing-operations-platform-fullstack:0.2.2 .
```

Key output:

```text
#0 building with "desktop-linux" instance using docker driver
#1 [internal] load build definition from Dockerfile
#22 exporting manifest list sha256:22a408206046396a589a2fad69a167db4640916c066a3f8ee0356556082a1346
#22 naming to docker.io/vinodreddy1999/manufacturing-operations-platform-fullstack:latest done
#22 naming to docker.io/vinodreddy1999/manufacturing-operations-platform-fullstack:0.2.2 done
#22 DONE 0.3s
```

Image validation:

```text
REPOSITORY                                                   TAG       IMAGE ID       CREATED        SIZE
vinodreddy1999/manufacturing-operations-platform-fullstack   0.2.2     22a408206046   11 hours ago   546MB
vinodreddy1999/manufacturing-operations-platform-fullstack   latest    22a408206046   11 hours ago   546MB
```

Image inspect:

```text
ImageID=sha256:22a408206046396a589a2fad69a167db4640916c066a3f8ee0356556082a1346
Created=2026-06-12T18:12:32.338928914Z
Size=123693529
```

## Docker Hub Evidence

Commands:

```bash
docker push vinodreddy1999/manufacturing-operations-platform-fullstack:0.2.2
docker push vinodreddy1999/manufacturing-operations-platform-fullstack:latest
```

Push output:

```text
0.2.2: digest: sha256:22a408206046396a589a2fad69a167db4640916c066a3f8ee0356556082a1346 size: 856
latest: digest: sha256:22a408206046396a589a2fad69a167db4640916c066a3f8ee0356556082a1346 size: 856
```

Remote manifest confirmation:

```text
"digest": "sha256:e39f5c61c8f446eddd09c513c8b93a0982d14785cad2a188e2054c1b48779be9"
"architecture": "amd64"
"os": "linux"
```

## Deployment Evidence

Current container before replacement:

```text
Container=7742672ff3b89a9fb2b63e19866f8bb90ad1ce5a32849560cfe58496c80328b6
Image=sha256:4810d926d5eeb27ab6b2e73ebbe4e622748877287f41971f652071f6f6a20059
Mounts=[{"Destination":"/data","Name":"mop_fullstack_data","RW":true,"Type":"volume"}]
```

Commands:

```bash
docker stop mop-fullstack-validation
docker rm mop-fullstack-validation
docker run -d --name mop-fullstack-validation -p 8080:8080 -v mop_fullstack_data:/data vinodreddy1999/manufacturing-operations-platform-fullstack:latest
```

New container:

```text
5e3b5c39ee51d3aa15c3ca58b14b9c72d5b5a031711bcc018483dd3ba5849cec
```

Container status:

```text
NAMES                      IMAGE                                                               STATUS          PORTS
mop-fullstack-validation   vinodreddy1999/manufacturing-operations-platform-fullstack:latest   Up 17 seconds   0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp
```

Container inspect:

```text
Container=5e3b5c39ee51d3aa15c3ca58b14b9c72d5b5a031711bcc018483dd3ba5849cec
Image=sha256:22a408206046396a589a2fad69a167db4640916c066a3f8ee0356556082a1346
Status=running
Started=2026-06-13T05:18:15.951210747Z
```

Logs:

```text
Application startup complete.
Uvicorn running on http://0.0.0.0:8080
"GET /health HTTP/1.1" 200 OK
"GET /ready HTTP/1.1" 200 OK
```

## Validation Evidence

Readiness:

```text
success=True message=OK data={status=ready; database=connected}
```

Health:

```text
status=ok runtime=python-fastapi service=manufacturing-operations-platform
```

Version:

```text
info_version=0.2.2 openapi_version=0.2.2 runtime=python-fastapi-react
```

Frontend accessibility:

```text
StatusCode=200 StatusDescription=OK
```

Runtime analytics:

```json
{
  "active_users": 75,
  "disabled_users": 6,
  "company_counts": {
    "company-c": 183,
    "company-apex": 81,
    "company-nova": 81,
    "company-fresh": 81,
    "company-med": 81
  },
  "apex_inventory_records": 12
}
```

## Final Status

- Docker image rebuilt successfully.
- Image pushed to Docker Hub.
- Application deployed successfully.
- Health checks and version checks passed.
- Multi-company runtime data validated.
