# Lesson 5 - Application Life Cycle

In this lab, we are going to explore application life cycle management for CaaSP.


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

Create a `suseapp` namespace to run this lesson's exercise.

```
kubectl create ns suseapp
```

## Lab 1 - Deploy stateful apps to CaaSP

We are going to use MySQL as example. A web-based mysql management tools called Adminer will also be deployed to verify the MySQL is operational.

### Step 1 - Deploy MySQL on CaaSP

Switch to the `lesson5` folder. 

```
cd ~/suse-container-workshop/lab/lesson5/sample-microservices/
```

Examine the content of `01-mysql/*.yaml` file. What do these scripts trying to achieve? Is there anything you saw we need to improve in the manifest file?

Create a persistent volume claim (pvc) for mysql to store its database.

```
kubectl apply -f 01-mysql/pvc.yaml
kubectl apply -f 01-mysql/deployment.yaml
```

The above 2 commands will create a deployment of mysql container with storage on SUSE CaaSP.

Where can I find the password of the mysql engine? What's the better way to store this mysql password in manifest?

### Step 2 - Check the deployment status of mysql

```
kubectl get pod -n suseapp
```

Identify the name of the mysql pod and run the following command.

```
kubectl describe pod mysql-ABCDEFG -n suseapp
```

Ensure the pod is running before continue.

### Step 3 - Verify if the mysql pod is in service now.

To run a containerized mysql client, execute the command below.

```
kubectl run -n suseapp -it --rm --image=mysql:5.6 --restart=Never mysql-client-$RANDOM -- mysql -h mysql -ppassword
```

After a while (downloading the image), it will show the following prompt.

```
If you don't see a command prompt, try pressing enter.
mysql>
```

Run the following command in the `mysql>` prompt to see if mysql is operational.

```
show databases;
exit
```

### Step 4 - Deploy Adminer (mysql webadmin)

Check the content of the following yaml files. Apply the scripts below to create a NodePort based Service for Adminer. 

```
kubectl apply -f 02-adminer/deploy.yaml
kubectl apply -f 02-adminer/service.yaml
```

Ensure the adminer deploy is successful. Then check the ip address and port number to access to Adminer. 

Check and record the external IP address of the master node. (EXTERNAL IP)

```
kubectl get node -o wide 
```

Get the port number of the adminer. (PORT)

```
kubectl get service adminer -n suseapp 
```

You should now be able to access to `http://[EXTERNAL IP]:[PORT]` to open adminer

You can set the credential of mysql as below.

```
user: root
pass: password
```

### Lab 2 - Deploy backend-nodejs RESTful API service and pass kubernetes' pod information to the application

Examine the deployment and service script. What did you notice?

```
kubectl apply -f 03-backend-nodejs/deploy.yaml
kubectl apply -f 03-backend-nodejs/service.yaml
```

Now check the progress with the command below.

```
kubectl get all -n suseapp
```

*CHALLENGE: Do all pods are running properly? If not, how can you troubleshoot and fix the issue?*

After all pods are running, let's verify if the backend-nodejs RESTful API is in action with the command below.

```
kubectl run -n suseapp -it --rm --image=alpine --restart=Never test-$RANDOM
```

A command prompt will show up for alpine. Then, enter the following command to verify if backend-nodejs is working.

```
wget http://backend-nodejs
cat index.html
```

Let's also examine the application log of the `backend-nodejs` pod.

First identify the name of the pod

```
kubectl get pod -n suseapp
```

Then, run the comand like below (Use your own pod name)

```
kubectl logs backend-nodejs-7b6f5cc67f-scv4d -n suseapp
```

You should see the output like below.

```
+ exec node server.js
The NodeName is: ip-10-1-4-107.ap-southeast-1.compute.internal
The PodName is: backend-nodejs-7b6f5cc67f-scv4d
The PodNamespace is: suseapp
The PodIPaddress is: 10.107.65.54
Node.js backend app listening on port 3000!
```

## Lab 3 - Scale out and Rolling Update an App

Let's scale out the app to 10 replicas

```
kubectl scale --replicas=10 deploy/backend-nodejs -n suseapp
```

The output would be similar to the one below - having 10 replicas of backend-nodejs instances running.

```
# kubectl get pod -n suseapp
NAME                              READY   STATUS    RESTARTS   AGE
adminer-84f6bfd7c8-kjzxl          1/1     Running   0          11h
backend-nodejs-7b6f5cc67f-28fpf   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-2w6pp   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-48982   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-956h6   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-bjh4z   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-f4b4s   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-nsfgg   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-v5h62   1/1     Running   0          21s
backend-nodejs-7b6f5cc67f-xsbms   1/1     Running   0          8h
backend-nodejs-7b6f5cc67f-ztcrt   1/1     Running   0          21s
mysql-647c46478f-p7t8h            1/1     Running   0          11h
```

Let's update from version 1.0 to version 2.0

```
kubectl set image deploy/backend-nodejs backend-nodejs=susesamples/backend-nodejs:2.0 -n suseapp --record=true
```

Now, let's check rollout status

```
kubectl rollout status deploy backend-nodejs -n suseapp
```

Review deployment history... all pods are updated to 2.0

```
# kubectl rollout history deployment backend-nodejs -n suseapp
deployment.apps/backend-nodejs
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
3         kubectl set image deploy/backend-nodejs backend-nodejs=susesamples/backend-nodejs:2.0 --namespace=suseapp --record=true
```

Scale back

```
kubectl scale --replicas=1 deploy/backend-nodejs -n suseapp
```

## Lab 4 - Examine Cilium in CaaSP

### Step 1 - List all cilium agents

```
kubectl get pod -n kube-system -o wide | grep cilium
```

Output is like below. Any pod name with cilium- prefix are cilium agents.

```
# kubectl get pod -n kube-system -o wide | grep cilium
cilium-2gntp                                                            1/1     Running   1          24h   10.1.4.204       ip-10-1-4-204.ap-southeast-1.compute.internal   <none>           <none>
cilium-4d7p7                                                            1/1     Running   1          24h   10.1.4.107       ip-10-1-4-107.ap-southeast-1.compute.internal   <none>           <none>
cilium-operator-5dc8bf8b57-tsfbl                                        1/1     Running   0          23h   10.1.4.204       ip-10-1-4-204.ap-southeast-1.compute.internal   <none>           <none>
cilium-xwskh                                                            1/1     Running   1          24h   10.1.1.253       ip-10-1-1-253.ap-southeast-1.compute.internal   <none>           <none>
```

### Step 2 - Connect to one of the cilium agents in worker node 

```
kubectl exec -it cilium-4d7p7 -n kube-system -- cilium status --all-controllers --all-health --all-redirects
```

You should see the following outputs

```
# kubectl exec -it cilium-4d7p7 -n kube-system -- cilium status  --all-controllers --all-health --all-redirects
KVStore:                Ok   Disabled
ContainerRuntime:       Ok   cri-o client: Ok - cri daemon: Ok
Kubernetes:             Ok   1.17 (v1.17.4) [linux/amd64]
Kubernetes APIs:        ["CustomResourceDefinition", "cilium/v2::CiliumEndpoint", "cilium/v2::CiliumNetworkPolicy", "cilium/v2::CiliumNode", "core/v1::Endpoint", "core/v1::Namespace", "core/v1::Pods", "core/v1::Service", "networking.k8s.io/v1::NetworkPolicy"]
Cilium:                 Ok   OK
NodeMonitor:            Disabled
Cilium health daemon:   Ok
IPAM:                   IPv4: 7/65535 allocated from 10.107.0.0/16,
Controller Status:      31/31 healthy
  Name                                  Last success    Last error   Count   Message
  cilium-health-ep                      43s ago         never        0       no error
  dns-garbage-collector-job             45s ago         never        0       no error
  endpoint-128-regeneration-recovery    never           never        0       no error
  endpoint-1796-regeneration-recovery   never           never        0       no error
  endpoint-3122-regeneration-recovery   never           never        0       no error
  endpoint-3559-regeneration-recovery   never           never        0       no error
  endpoint-522-regeneration-recovery    never           never        0       no error
  endpoint-995-regeneration-recovery    never           never        0       no error
  metricsmap-bpf-prom-sync              5s ago          never        0       no error
  resolve-identity-128                  1m42s ago       never        0       no error
  resolve-identity-1796                 1m44s ago       never        0       no error
  resolve-identity-3122                 1m45s ago       never        0       no error
  resolve-identity-3559                 2m42s ago       never        0       no error
  resolve-identity-522                  1m42s ago       never        0       no error
  resolve-identity-995                  1m55s ago       never        0       no error
  sync-endpoints-and-host-ips           45s ago         never        0       no error
  sync-lb-maps-with-k8s-services        23h26m45s ago   never        0       no error
  sync-policymap-128                    30s ago         never        0       no error
  sync-policymap-1796                   30s ago         never        0       no error
  sync-policymap-3122                   30s ago         never        0       no error
  sync-policymap-3559                   30s ago         never        0       no error
  sync-policymap-522                    30s ago         never        0       no error
  sync-policymap-995                    30s ago         never        0       no error
  sync-to-k8s-ciliumendpoint (128)      8s ago          never        0       no error
  sync-to-k8s-ciliumendpoint (1796)     3s ago          never        0       no error
  sync-to-k8s-ciliumendpoint (3122)     1s ago          never        0       no error
  sync-to-k8s-ciliumendpoint (3559)     9s ago          never        0       no error
  sync-to-k8s-ciliumendpoint (522)      8s ago          never        0       no error
  sync-to-k8s-ciliumendpoint (995)      2s ago          never        0       no error
  template-dir-watcher                  never           never        0       no error
  update-k8s-node-annotations           23h26m48s ago   never        0       no error
Proxy Status:   OK, ip 10.107.4.174, port-range 10000-20000
Cluster health:                                               3/3 reachable   (2020-07-21T23:47:08Z)
  Name                                                        IP              Reachable   Endpoints reachable
  ip-10-1-4-107.ap-southeast-1.compute.internal (localhost)   10.1.4.107      true        true
  ip-10-1-1-253.ap-southeast-1.compute.internal               10.1.1.253      true        true
  ip-10-1-4-204.ap-southeast-1.compute.internal               10.1.4.204      true        true
```

### Step 3 - Review cilium configuration for a worker node

```
kubectl exec -it cilium-4d7p7 -n kube-system -- cilium config
```

The output is like below.

```
Conntrack                Enabled
ConntrackAccounting      Enabled
ConntrackLocal           Disabled
Debug                    Disabled
DebugLB                  Disabled
DropNotification         Enabled
MonitorAggregationLevel  None
PolicyTracing            Disabled
TraceNotification        Enabled
k8s-configuration
k8s-endpoint
PolicyEnforcement        default
```

### Step 4 - Check for drop packets

Run this command to check if there's any packdrop to the agent running on a specific node.

```
kubectl exec -it cilium-4d7p7 -n kube-system -- cilium monitor --type drop
```

### Step 5 - Check network healthiness with cilium

To review the detailed status status of Cilium in your cluster

```
kubectl exec -it cilium-4d7p7 -n kube-system -- cilium status
```

You will see the following output indicating the networking of the cluster is healthy.

```
KVStore:                Ok   Disabled
ContainerRuntime:       Ok   cri-o client: Ok - cri daemon: Ok
Kubernetes:             Ok   1.17 (v1.17.4) [linux/amd64]
Kubernetes APIs:        ["CustomResourceDefinition", "cilium/v2::CiliumEndpoint", "cilium/v2::CiliumNetworkPolicy", "cilium/v2::CiliumNode", "core/v1::Endpoint", "core/v1::Namespace", "core/v1::Pods", "core/v1::Service", "networking.k8s.io/v1::NetworkPolicy"]
Cilium:                 Ok   OK
NodeMonitor:            Listening for events on 2 CPUs with 64x4096 of shared memory
Cilium health daemon:   Ok
IPAM:                   IPv4: 7/65535 allocated from 10.107.0.0/16,
Controller Status:      31/31 healthy
Proxy Status:           OK, ip 10.107.4.174, port-range 10000-20000
Cluster health:   3/3 reachable   (2020-07-21T23:56:08Z)
```


To describe the connectivity from each node to every other nodes in the cluster, and to a simulated endpoint on each other node.

```
cilium-health status
```

You will see all the end-point connectivity status which is in good shape as well :-)

```
kubectl exec -it cilium-4d7p7 -n kube-system -- cilium-health status
Probe time:   2020-07-21T23:57:08Z
Nodes:
  ip-10-1-4-107.ap-southeast-1.compute.internal (localhost):
    Host connectivity to 10.1.4.107:
      ICMP to stack:   OK, RTT=281.372µs
      HTTP to agent:   OK, RTT=106.127µs
    Endpoint connectivity to 10.107.92.235:
      ICMP to stack:   OK, RTT=300.123µs
      HTTP to agent:   OK, RTT=226.034µs
  ip-10-1-1-253.ap-southeast-1.compute.internal:
    Host connectivity to 10.1.1.253:
      ICMP to stack:   OK, RTT=319.499µs
      HTTP to agent:   OK, RTT=410.179µs
    Endpoint connectivity to 10.253.19.209:
      ICMP to stack:   OK, RTT=396.035µs
      HTTP to agent:   OK, RTT=381.263µs
  ip-10-1-4-204.ap-southeast-1.compute.internal:
    Host connectivity to 10.1.4.204:
      ICMP to stack:   OK, RTT=308.478µs
      HTTP to agent:   OK, RTT=226.072µs
    Endpoint connectivity to 10.204.164.111:
      ICMP to stack:   OK, RTT=435.241µs
      HTTP to agent:   OK, RTT=327.414µs
```

## Lab 5 - Secure backend-nodejs API service with cilium L7 Network Policy

### Step 1 - change to the cilium network policy manifest folder

```
cd ~/suse-container-workshop/lab/lesson5/sample-microservices/cilium
```

### Step 2 - Apply the L7 network policy for backend-nodejs

```
kubectl apply -f backend-nodejs-http-get-only.yaml
```

Output should be like below.

```
ciliumnetworkpolicy.cilium.io/backend-nodejs-http-get-only created
```

### Step 3 - Check if the policy is created.

```
kubectl get cnp -n suseapp
```

Output will be like the following.

```
# kubectl get cnp -n suseapp
NAME                           AGE
backend-nodejs-http-get-only   12s
```

### Step 4 - verification


