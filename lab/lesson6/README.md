# Lesson 6 - Continuous Integration / Continuous Delivery

In this lab, we are going to explore continuous integration and continuous delivery with SUSE CaaSP

## Before start the lab, connect to the CaaSP Management Workstation

You should be given a deployed CaaSP cluster to get started. Just ssh into the CaaSP management workstation to run this lab.

For example, download the ssh key file (susetech-labs.pem) and run the command below to connect to the CaaSP management workstation.

```
export MYLAB=student1
ssh -i ~/.ssh/susetech-labs.pem tux@$MYLAB.lab.susetech.org
```

Make sure you login as `tux` user in the CaaSP management workstation.

Run the following command to fetch the latest set of files from github for this lab:

```
cd ~/suse-container-workshop
git pull
```

## Lab 1 - Install Harbor Registry

In this exercise, we are going to install Harbor Registry onto SUSE CaaSP cluster within `harbor-system` namespace using `helm` chart.

### 1. Make the current storage class as default

```
kubectl patch storageclass gp2scoped -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

Verify the storage class has been marked as default

```
# kubectl get sc
NAME                  PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
gp2scoped (default)   kubernetes.io/aws-ebs   Retain          Immediate           false                  3d18h
```

### 2. Initialize helm client and add harbor helm repository

To make it easy, we are going to use the helm chart created by bitnami. For detailed setup, please visit https://hub.helm.sh/charts/bitnami/harbor

```
helm init --client-only
helm repo add bitnami https://charts.bitnami.com/bitnami
```

Verify if you can run helm with `tux` linux user account like below.

```
# helm ls
NAME           	REVISION	UPDATED                 	STATUS  	CHART        	APP VERSION	NAMESPACE
stratos-console	1       	Fri Jul 31 21:46:01 2020	DEPLOYED	console-3.2.1	2.0.0      	stratos
```

Verify helm repository is added

```
# helm repo list
NAME   	URL
stable 	https://kubernetes-charts.storage.googleapis.com
local  	http://127.0.0.1:8879/charts
bitnami	https://charts.bitnami.com/bitnami
```

### 3. Create harbor-system namespace

```
kubectl create ns harbor-system
```

### 4. Deploy harbor with helm chart

```
helm install bitnami/harbor \
  --name harbor --version 6.0.11 \
  --namespace harbor-system \
  --set harborAdminPassword=password \
  --set global.storageClass=gp2scoped \
  --set service.type=NodePort \
  --set service.tls.commonName=harbor.domain
```

The output would be like below.

```
NAME:   harbor
E0804 16:46:15.576766   21566 portforward.go:372] error copying from remote stream to local connection: readfrom tcp4 127.0.0.1:38167->127.0.0.1:34370: write tcp4 127.0.0.1:38167->127.0.0.1:34370: write: broken pipe
LAST DEPLOYED: Tue Aug  4 16:46:10 2020
NAMESPACE: harbor-system
STATUS: DEPLOYED

RESOURCES:
==> v1/ConfigMap
NAME                            AGE
harbor-chartmuseum-envvars      1s
harbor-core                     1s
harbor-core-envvars             1s
harbor-jobservice               1s
harbor-jobservice-envvars       1s
harbor-nginx                    1s
harbor-portal                   1s
harbor-postgresql-init-scripts  1s
harbor-redis                    1s
harbor-redis-health             1s
harbor-registry                 1s
harbor-trivy-envvars            1s

==> v1/Deployment
NAME                  AGE
harbor-chartmuseum    0s
harbor-clair          0s
harbor-core           0s
harbor-jobservice     0s
harbor-nginx          0s
harbor-notary-server  0s
harbor-notary-signer  0s
harbor-portal         0s
harbor-registry       0s

==> v1/PersistentVolumeClaim
NAME                AGE
harbor-chartmuseum  1s
harbor-jobservice   1s
harbor-registry     1s

==> v1/Pod(related)
NAME                                   AGE
harbor-chartmuseum-69c8dbd7b7-bm8r4    0s
harbor-clair-664f5d6896-rklzk          0s
harbor-core-647985dd79-zdltf           0s
harbor-jobservice-558b7764f6-pwvcb     0s
harbor-nginx-99658f667-8tkp6           0s
harbor-notary-server-6bc5c887d-zh62f   0s
harbor-notary-signer-5cc4b496c5-dnghb  0s
harbor-portal-7bf8f5848b-j8568         0s
harbor-postgresql-0                    0s
harbor-redis-master-0                  0s
harbor-registry-bf8676b76-bvtkl        0s
harbor-trivy-0                         0s

==> v1/Secret
NAME                       AGE
harbor-chartmuseum-secret  1s
harbor-clair               1s
harbor-core                1s
harbor-core-envvars        1s
harbor-jobservice          1s
harbor-jobservice-envvars  1s
harbor-nginx               1s
harbor-notary-server       1s
harbor-postgresql          1s
harbor-registry            1s
harbor-trivy-envvars       1s

==> v1/Service
NAME                        AGE
harbor                      1s
harbor-chartmuseum          1s
harbor-clair                1s
harbor-core                 1s
harbor-jobservice           1s
harbor-notary-server        0s
harbor-notary-signer        1s
harbor-portal               1s
harbor-postgresql           1s
harbor-postgresql-headless  1s
harbor-redis-headless       1s
harbor-redis-master         1s
harbor-registry             1s
harbor-trivy                1s

==> v1/StatefulSet
NAME                 AGE
harbor-postgresql    0s
harbor-redis-master  0s
harbor-trivy         0s


NOTES:
** Please be patient while the chart is being deployed **

1. Get the Harbor URL:

  export NODE_PORT=$(kubectl get --namespace harbor-system -o jsonpath="{.spec.ports[0].nodePort}" services harbor)
  export NODE_IP=$(kubectl get nodes --namespace harbor-system -o jsonpath="{.items[0].status.addresses[0].address}")
  echo "Harbor URL: http://$NODE_IP:$NODE_PORT/"

2. Login with the following credentials to see your Harbor application

  echo Username: "admin"
  echo Password: $(kubectl get secret --namespace harbor-system harbor-core-envvars -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode)

```

Run the following command to check if all harbor related pods are up and running.

```
watch -c 'kubectl get pod -n harbor-system'
```

You should be able to see an output like below.

```
Every 2.0s: kubectl get pod -n harbor-system                                                                                           admin-ws: Tue Aug  4 16:50:17 2020

NAME                                    READY   STATUS    RESTARTS   AGE
harbor-chartmuseum-69c8dbd7b7-bm8r4     1/1     Running   0          4m3s
harbor-clair-664f5d6896-rklzk           2/2     Running   1          4m3s
harbor-core-647985dd79-zdltf            1/1     Running   1          4m3s
harbor-jobservice-558b7764f6-pwvcb      1/1     Running   0          4m3s
harbor-nginx-99658f667-8tkp6            1/1     Running   0          4m3s
harbor-notary-server-6bc5c887d-zh62f    1/1     Running   1          4m3s
harbor-notary-signer-5cc4b496c5-dnghb   1/1     Running   1          4m3s
harbor-portal-7bf8f5848b-j8568          1/1     Running   0          4m3s
harbor-postgresql-0                     1/1     Running   0          4m3s
harbor-redis-master-0                   1/1     Running   0          4m3s
harbor-registry-bf8676b76-bvtkl         2/2     Running   0          4m3s
harbor-trivy-0                          1/1     Running   0          4m3s
```

### 5. Get the harbor URL:

```
export NODE_PORT=$(kubectl get --namespace harbor-system -o jsonpath="{.spec.ports[1].nodePort}" services harbor)
export NODE_IP=$(kubectl get nodes --namespace harbor-system -o jsonpath="{.items[0].status.addresses[1].address}")
echo "Harbor URL: https://$NODE_IP:$NODE_PORT/"
```

The output would be like this:

```
Harbor URL: https://46.137.224.24:31569/
```

Visit the link above with your browser and you should see a login page after accepting invalid SSL certification warning.

![Harbor Login](/lab/lesson6/images/harbor-login.png)

### 6. Login as administrator with the following credentials:

```
user: admin
pass: password
```

You should then be able to navigate into the home page like below.

![Harbor Dashboard](/lab/lesson6/images/harbor-dashboard.png)


