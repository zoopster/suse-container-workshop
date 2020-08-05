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

### 2. Initialize helm client and add suse and  harbor helm repository

To make it easy, we are going to use the helm chart created by bitnami. For detailed setup, please visit https://hub.helm.sh/charts/bitnami/harbor

```
helm init --client-only
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add suse https://kubernetes-charts.suse.com
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
suse   	https://kubernetes-charts.suse.com
```

### 3. Deploy nginx ingress controller

Use helm chart to deploy the nginx ingress controller

```
helm install --name nginx-ingress suse/nginx-ingress \
  --namespace nginx-ingress \
  --values ~/suse-container-workshop/lab/lesson6/nginx-ingress-config-values.yaml
```

Verify if nginx-ingress is ready

```
# kubectl get all -n nginx-ingress
NAME                                                 READY   STATUS    RESTARTS   AGE
pod/nginx-ingress-controller-6b46bb7f6f-bkfdv        1/1     Running   0          67s
pod/nginx-ingress-default-backend-84f74bdfb6-vslm2   1/1     Running   0          67s

NAME                                    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
service/nginx-ingress-controller        NodePort    10.109.239.169   <none>        443:32443/TCP   67s
service/nginx-ingress-default-backend   ClusterIP   10.96.118.246    <none>        80/TCP          67s

NAME                                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx-ingress-controller        1/1     1            1           67s
deployment.apps/nginx-ingress-default-backend   1/1     1            1           67s

NAME                                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-ingress-controller-6b46bb7f6f        1         1         1       67s
replicaset.apps/nginx-ingress-default-backend-84f74bdfb6   1         1         1       67s
```

### 4. Add /etc/hosts entry

Find the external IP of the SUSE CaaSP cluster

```
export NODE_IP=$(kubectl --namespace nginx-ingress get nodes -o jsonpath="{.items[0].status.addresses[1].address}")
echo $NODE_IP
```

For example, your IP is `46.137.224.24`, add the following entries in `/etc/hosts` file (with `sudo` privilege)

```
sudo vi /etc/hosts
```

Entry:

```
46.137.224.24	registry.suse.workshop core.suse.workshop notary.suse.workshop
```

Verify if nginx-ingress is working:

```
curl -k https://registry.suse.workshop:32443
```

This should output `default backend - 404` as a result of the curl command.


### 5. Create harbor-system namespace

```
kubectl create ns harbor-system
```

### 6. Deploy harbor with helm chart

```
helm install bitnami/harbor \
  --name harbor --version 6.0.11 \
  --namespace harbor-system \
  --set harborAdminPassword=password \
  --set global.storageClass=gp2scoped \
  --set service.type=Ingress \
  --set service.tls.commonName=registry.suse.workshop \
  --set externalURL=https://registry.suse.workshop:32443 \
  --set ingress.enabled=true \
  --set ingress.hosts.core=core.suse.workshop \
  --set ingress.hosts.notary=notary.suse.workshop \
  --set persistence.resourcePolicy= \
  --set registry.credentials.username=admin \
  --set registry.credentials.password=password 
```

The output would be like below.

```
NAME:   harbor
LAST DEPLOYED: Tue Aug  4 20:03:54 2020
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
harbor-portal                   1s
harbor-postgresql-init-scripts  1s
harbor-redis                    1s
harbor-redis-health             1s
harbor-registry                 1s
harbor-trivy-envvars            1s

==> v1/Deployment
NAME                  AGE
harbor-chartmuseum    1s
harbor-clair          1s
harbor-core           1s
harbor-jobservice     1s
harbor-notary-server  1s
harbor-notary-signer  1s
harbor-portal         1s
harbor-registry       1s

==> v1/PersistentVolumeClaim
NAME                AGE
harbor-chartmuseum  1s
harbor-jobservice   1s
harbor-registry     1s

==> v1/Pod(related)
NAME                                   AGE
harbor-chartmuseum-5cd5c9ff7f-lvmgf    1s
harbor-clair-664f5d6896-c8548          1s
harbor-core-69c77c6cfb-g8qkt           1s
harbor-jobservice-6c6cf8746f-nqkrb     1s
harbor-notary-server-7f8c6b446b-npfgj  0s
harbor-notary-signer-658fc6b5f9-dkmb4  0s
harbor-portal-7bf8f5848b-hl274         0s
harbor-postgresql-0                    0s
harbor-redis-master-0                  0s
harbor-registry-56cfd75df5-rwdbq       1s
harbor-trivy-0                         0s

==> v1/Secret
NAME                       AGE
harbor-chartmuseum-secret  1s
harbor-clair               1s
harbor-core                1s
harbor-core-envvars        1s
harbor-ingress             1s
harbor-jobservice          1s
harbor-jobservice-envvars  1s
harbor-notary-server       1s
harbor-postgresql          1s
harbor-registry            1s
harbor-trivy-envvars       1s

==> v1/Service
NAME                        AGE
harbor-chartmuseum          1s
harbor-clair                1s
harbor-core                 1s
harbor-jobservice           1s
harbor-notary-server        1s
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
harbor-postgresql    1s
harbor-redis-master  1s
harbor-trivy         1s

==> v1beta1/Ingress
NAME                   AGE
harbor-ingress         0s
harbor-ingress-notary  0s


NOTES:
** Please be patient while the chart is being deployed **

1. Get the Harbor URL:

  You should be able to access your new Harbor installation through https://registry.suse.workshop:32443

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

### 6. Visit Habor UI

The harbor link should be `https://core.suse.workshop:32443`

Visit the link above with your browser and you should see a login page after accepting invalid SSL certification warning.

![Harbor Login](/lab/lesson6/images/harbor-login.png)

### 6. Login as administrator with the following credentials:

```
user: admin
pass: password
```

You should then be able to navigate into the home page like below.

![Harbor Dashboard](/lab/lesson6/images/harbor-dashboard.png)


### 7. Setup docker client to authenticate against Harbor

NOTE: Not working yet 

First, we need to add harbor.domain

Using sudo privilege, edit `/etc/docker/daemon.json` file and add the `insecure registries` in the json file.

```
sudo vi /etc/docker/daemon.json
```

Enter content like below. (Port number must be matching with `$NODE_PORT` found in Step 6.

```
{
  "log-level": "warn",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  },
  "insecure-registries" : ["core.suse.workshop:32443"]
}
```

Restart docker service to pick up the configuration change.

```
sudo systemctl restart docker
```

Verify if the entry is added.

```
docker info
```

You should see the following output extracted.

```
 Insecure Registries:
  core.suse.workshop:32443
  127.0.0.0/8
```


## Lab 2 - install jenkins

### 1. Deploy jenkins onto SUSE CaaSP with helm

```
helm install stable/jenkins --name jenkins \
  --namespace jenkins-system \
  --values ~/suse-container-workshop/lab/lesson6/jenkins-config-values.yaml
```

### 2. Verify if jenkins is ready

```
kubectl get all -n jenkins-system
```

Output would be like below.

```
NAME                          READY   STATUS    RESTARTS   AGE
pod/jenkins-8684788b9-fxrpq   2/2     Running   0          2m36s

NAME                    TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
service/jenkins         NodePort    10.106.216.247   <none>        8080:32450/TCP   2m36s
service/jenkins-agent   ClusterIP   10.101.139.195   <none>        50000/TCP        2m36s

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/jenkins   1/1     1            1           2m36s

NAME                                DESIRED   CURRENT   READY   AGE
replicaset.apps/jenkins-8684788b9   1         1         1       2m36s
```

### 3. Visit the jenkins URL

Find the jenkins URL

```
export NODE_IP=$(kubectl --namespace nginx-ingress get nodes -o jsonpath="{.items[0].status.addresses[1].address}")
export NODE_PORT=$(kubectl get svc jenkins -n jenkins-system -o jsonpath="{.spec.ports[0]['nodePort']}")
echo "http://$NODE_IP:$NODE_PORT"
```

The output should be the URL of jenkins:

```
http://46.137.224.24:32450
```

You should see the following screen with a browser.

![Jenkins](/lab/lesson6/images/jenkins.png)



## Lab 3 - Build App Delivery Pipeline on Jenkins

### Make sure you have login credential for dockerhub and github

We will use Github and Dockerhub in this lab exercise.


1. Fork from https://github.com/dsohk/spring-petclinic.git

2. Login to Jenkins

3. Follow me on the instruction...

