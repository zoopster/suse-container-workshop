# Lesson 4 - Day 2 Operation

In this lab, we are going to explore some common day 2 operations for CaaSP.


## Connect to the CaaSP Management Workstation

You should be given a deployed CaaSP cluster to get started. Just ssh into the CaaSP management workstation to run this lab.

For example, download the ssh key file (susetech-labs.pem) and run the command below to connect to the CaaSP management workstation.

```
export MYLAB=student1
ssh -i ~/.ssh/susetech-labs.pem ec2-user@$MYLAB.lab.susetech.org
```

## Lab 1 - Horizontal Pod Autoscaler (HPA)

With metrics server installed by default in CaaSP 4.2, HPA feature can be used right away. Let's try it out in this lab exercise.

### Step 1 - Verify metrics server is working

To get node level utilization

```
kubectl top node
```

To get pod utilization in a specific namespace
```
kubectl top pod -n <namespace>
```

For example,

```
# kubectl top node
NAME                                            CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
ip-10-1-1-248.ap-southeast-1.compute.internal   102m         5%     1084Mi          28%       
ip-10-1-4-148.ap-southeast-1.compute.internal   24m          1%     596Mi           15%       
ip-10-1-4-183.ap-southeast-1.compute.internal   113m         5%     978Mi           25%       

# kubectl top pod -n kube-system
NAME                                                                    CPU(cores)   MEMORY(bytes)   
cilium-lsxq6                                                            4m           202Mi           
cilium-operator-5dc8bf8b57-gl86d                                        1m           39Mi            
cilium-zfcz2                                                            8m           201Mi           
cilium-zpkzs                                                            18m          210Mi           
coredns-578668d4f8-bn7jx                                                3m           32Mi            
coredns-578668d4f8-lpgzx                                                3m           31Mi            
etcd-ip-10-1-1-248.ap-southeast-1.compute.internal                      14m          54Mi            
kube-apiserver-ip-10-1-1-248.ap-southeast-1.compute.internal            27m          282Mi           
kube-controller-manager-ip-10-1-1-248.ap-southeast-1.compute.internal   10m          53Mi            
kube-proxy-4w5w9                                                        1m           24Mi            
kube-proxy-v27tk                                                        1m           22Mi            
kube-proxy-vgj6b                                                        1m           26Mi            
kube-scheduler-ip-10-1-1-248.ap-southeast-1.compute.internal            4m           29Mi            
kured-gttxt                                                             1m           23Mi            
kured-qbksx                                                             1m           23Mi            
kured-xtqgx                                                             1m           23Mi            
metrics-server-ff6bc74f7-4p9ft                                          1m           31Mi            
metrics-server-ff6bc74f7-jrmlc                                          2m           34Mi            
oidc-dex-779cd465cb-hw6mh                                               1m           13Mi            
oidc-dex-779cd465cb-nsq9t                                               1m           16Mi            
oidc-dex-779cd465cb-x75gd                                               1m           13Mi            
oidc-gangway-64799cfd55-879rp                                           0m           18Mi            
oidc-gangway-64799cfd55-hrp64                                           1m           16Mi            
oidc-gangway-64799cfd55-wtwjc                                           0m           16Mi            
tiller-deploy-6b954db788-8dv42                                          1m           10Mi       
```

### Step 2 - Create a namespace for this lab and set as the default namespace to be used in this lab.

Create a namespace to run this lab exercise and set as default namespace.

```
kubectl create ns hpademo
kubectl config set-context --current --namespace=hpademo
```

### Step 3 - Deploy a sample web 

```
git clone https://github.com/dsohk/suse-container-workshop
cd suse-container-workshop/lab/lesson4
kubectl apply -f k8s
```

Check the resources readiness in hpademo namespace with command `kubectl get all`. The output would be like following:

```
ec2-user@admin-ws:~/suse-container-workshop/lab/lesson4> kubectl get all
NAME                              READY   STATUS    RESTARTS   AGE
pod/hello-suse-74d6fdcdc9-nf7dg   1/1     Running   0          19s

NAME                 TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
service/hello-suse   NodePort   10.96.24.170   <none>        3000:30001/TCP   3m11s

NAME                         READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/hello-suse   1/1     1            1           19s

NAME                                    DESIRED   CURRENT   READY   AGE
replicaset.apps/hello-suse-74d6fdcdc9   1         1         1       19s

NAME                                             REFERENCE               TARGETS        MINPODS   MAXPODS   REPLICAS   AGE
horizontalpodautoscaler.autoscaling/hello-suse   Deployment/hello-suse   <unknown>/1%   1         10        1          3m11s
```

The `hello-suse` URL will be http://<worker-node-ip>:30001`. Let's check the worker node ip

```
ec2-user@admin-ws:~/suse-container-workshop/lab/lesson4> kubectl get node -o wide
NAME                                            STATUS   ROLES    AGE     VERSION   INTERNAL-IP   EXTERNAL-IP    OS-IMAGE                              KERNEL-VERSION           CONTAINER-RUNTIME
ip-10-1-1-248.ap-southeast-1.compute.internal   Ready    master   5h35m   v1.17.4   10.1.1.248    13.250.25.24   SUSE Linux Enterprise Server 15 SP1   4.12.14-197.45-default   cri-o://1.16.1
ip-10-1-4-148.ap-southeast-1.compute.internal   Ready    <none>   5h3m    v1.17.4   10.1.4.148    <none>         SUSE Linux Enterprise Server 15 SP1   4.12.14-197.45-default   cri-o://1.16.1
ip-10-1-4-183.ap-southeast-1.compute.internal   Ready    <none>   5h4m    v1.17.4   10.1.4.183    <none>         SUSE Linux Enterprise Server 15 SP1   4.12.14-197.45-default   cri-o://1.16.1
```

Just take any worker node IP to access to the hello-suse service. In this case, it would be `http://10.1.4.148:30001`

### Step 4 - Live demo of Horizontal Pod Autoscaling

#### First, install apache benchmark tool for stress test simulation.

```
sudo zypper install apache2-utils
```

#### Open 3 Terminals and kubernetes dashboard

* Open Stratos with Dashboard installed to view cluster utilization charts.
* Terminal 1 - Run `watch -n1 -c 'kubectl get pods -n hpademo'`
* Terminal 2 - Run `watch -n1 -c 'kubectl get hpa -n hpademo'` 
* Terminal 3 - Load test the web server with command `ab -c 20 -n 10000 -t 100000 http://10.1.4.148:30001/` (Replace the IP with your own worker node IP address AND notice the URL ends with forward slash).

Observations: HPA is in action... scale from 1 pod to 10 pods to serve the traffic loads.

```
ec2-user@admin-ws:~/suse-container-workshop/lab/lesson4> ab -c 20 -n 10000 -t 1000000 http://10.1.4.148:30001/
This is ApacheBench, Version 2.3 <$Revision: 1826891 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 10.1.4.148 (be patient)
Completed 5000 requests
Completed 10000 requests
Completed 15000 requests
Completed 20000 requests
Completed 25000 requests
Completed 30000 requests
Completed 35000 requests
Completed 40000 requests
Completed 45000 requests
Completed 50000 requests
Finished 50000 requests


Server Software:
Server Hostname:        10.1.4.148
Server Port:            30001

Document Path:          /
Document Length:        21 bytes

Concurrency Level:      20
Time taken for tests:   11.256 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      6100000 bytes
HTML transferred:       1050000 bytes
Requests per second:    4442.16 [#/sec] (mean)
Time per request:       4.502 [ms] (mean)
Time per request:       0.225 [ms] (mean, across all concurrent requests)
Transfer rate:          529.24 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.5      0      20
Processing:     0    4   5.5      2      87
Waiting:        0    3   4.4      2      85
Total:          0    4   5.6      2      87
```

```
Every 1.0s: kubectl get hpa                                                                                                                                             admin-ws: Tue Jul 14 20:41:43 2020

NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
hello-suse   Deployment/hello-suse   0%/1%     1         10        10         25m
```

```
Every 1.0s: kubectl get pod -n hpademo                                                                                                                                  admin-ws: Tue Jul 14 20:41:13 2020

NAME                          READY   STATUS    RESTARTS   AGE
hello-suse-74d6fdcdc9-2fspb   1/1     Running   0          112s
hello-suse-74d6fdcdc9-7n5k2   1/1     Running   0          97s
hello-suse-74d6fdcdc9-drfpw   1/1     Running   0          112s
hello-suse-74d6fdcdc9-f4fcw   1/1     Running   0          2m8s
hello-suse-74d6fdcdc9-g5mrs   1/1     Running   0          2m8s
hello-suse-74d6fdcdc9-kh6tp   1/1     Running   0          112s
```




## Lab 2 - Create Network Policy to isolate traffic between namespaces

In this lab, we are going to setup network policy to deny traffic from other namespaces, which means, traffic between pods is allowed within the same namespace.

This is useful when you use namespace as virtual grouping for your kubernetes tenants.

### Step 1 - Create 2 namespaces

Create 2 namespaces called `tenant1` and `tenant2`

```
kubectl create ns tenant1
kubectl create ns tenant2
```

### Step 2 - Deploy nginx service in each of the 2 namespaces

```
kubectl run --generator=run-pod/v1 web -n tenant1 --image=nginx --expose --port 80
kubectl run --generator=run-pod/v1 web -n tenant2 --image=nginx --expose --port 80
```

Run the following command to verify if the pod and service are up and running in both `tenant1` and `tenant2`.

```
kubectl get all -n tenant1
kubectl get all -n tenant2
```

The sample output of `kubectl get all -n tenant1` is as follows:

```
~> kubectl get all -n tenant1
NAME      READY   STATUS    RESTARTS   AGE
pod/web   1/1     Running   0          16s

NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
service/web   ClusterIP   10.101.178.49   <none>        80/TCP    16s
```

Please make sure the same output is seen for tenant2 as well.


### Step 3 - Verify the traffic is accessible within its own namespace (tenant)

```
kubectl run --generator=run-pod/v1 test-$RANDOM -n tenant1 --rm -it --image=alpine -- sh
```

Then, you will be shown a command prompt (line started with `\ #`) from the alpine container. Enter the following command and then exit.

```
wget -qO- --timeout=2 http://web.tenant1
exit
```

Output would be as follows :-

```
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
/ # exit
```

What about accessing from tenant1 to tenant2?

Create a client in `tenant1` and then try to use `wget` utility to access to `web.tenant2`

```
kubectl run --generator=run-pod/v1 test-$RANDOM -n tenant1 --rm -it --image=alpine -- sh
```

In the alpine container command prompt (line starts with `\ #`), enter the following:

```
wget -qO- --timeout=2 http://web.tenant2
exit
```

Did you see the same HTML markup code output? This is not good for tenant isolation. Let's apply network policy to prevent this.



### Step 4 - Define Network Policy to isolate traffic between namespaces

Let's define network policy to isolate traffic between namespaces

Save the file as `tenant1-netpol.yml`
```
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  namespace: tenant1
  name: tenant1-netpol
spec:
  podSelector:
    matchLabels:
  ingress:
  - from:
    - podSelector: {}
```

Some explanation of the above network policy
* it deploys to `namespace tenant1`
* it applies the network policy to ALL pods in tenant1 namespace as the `spec.podSelector.matchLabels` is empty which implies selecting all pods. 
* it allows traffic from ALL pods within tenant1 namespace, as `spec.ingress.from.podSelector` is empty which implies selecting all pods.


Apply the file for tenant1

```
kubectl apply -f tenant1-netpol.yml
```

Verify the network policy for tenant1 is created.

```
kuectl get netpol -n tenant1
```

Repeat the same for tenant2 by modifying the namespace to `tenant2`, saving the file as `tenant2-netpol.yml` and apply it.

```
cp tenant1-netpol.yaml tenant2-netpol.yaml
sed -i s/tenant1/tenant2/g tenant2-netpol.yaml
cat tenant2-netpol.yaml
kubectl apply -f tenant2-netpol.yaml
```

Verify the network policy for tenant2 is also created.

```
kubectl get netpol -n tenant2
```

### Step 5 - Verify traffic are blocked between tenants

#### Attempt to access web service in tenant1 from a pod in the same namespace:

```
kubectl run --generator=run-pod/v1 test-$RANDOM -n tenant1 --rm -it --image=alpine -- sh
```

Enter the following command in alpine container command prompt (lines start with `\ #`):
```
wget -qO- --timeout=2 http://web.tenant1
exit
```

Expected Output: HTML markup from NGINX


#### Attempt to access web service in tenant1 from another namespace `tenant2`:

```
kubectl run --generator=run-pod/v1 test-$RANDOM -n tenant2 --rm -it --image=alpine -- sh
```

Enter the following command in alpine container command prompt (lines start with `\ #`):

```
wget -qO- --timeout=2 http://web.tenant1
exit
```

Expected Output:
```
wget: download timed out
```

#### Attempt to access web service in tenant2 from a pod in the same namespace:

```
kubectl run --generator=run-pod/v1 test-$RANDOM -n tenant2 --rm -it --image=alpine -- sh
```

Enter the following command in alpine container command prompt (lines start with `\ #`):

```
wget -qO- --timeout=2 http://web.tenant2
exit
```


Expected Output: HTML markup from NGINX


#### Attempt to access web service in tenant2 from another namespace `tenant1`:

```
kubectl run --generator=run-pod/v1 test-$RANDOM -n tenant1 --rm -it --image=alpine -- sh
```

Enter the following command in alpine container command prompt (lines start with `\ #`):

```
wget -qO- --timeout=2 http://web.tenant2
exit
```


Expected Output:
```
wget: download timed out
```

### Clean up

```
kubectl delete ns tenant1
kubectl delete ns tenant2
```

That's the end of Lab 2. 

Thanks to `Ahmet Alp Balkan` (Senior software engineer at Google). For more network policy recipes, please visit https://github.com/ahmetb/kubernetes-network-policy-recipes




