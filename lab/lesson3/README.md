# Lesson 3 - Security & CaaSP

In this lab, we are going to explore some security tools used by the community to help assess security readiness of CaaSP for production use.


## Connect to the CaaSP Management Workstation

You should be given a deployed CaaSP cluster to get started. Just ssh into the CaaSP management workstation to run this lab.

For example, download the ssh key file (susetech-labs.pem) and run the command below to connect to the CaaSP management workstation.

```
export MYLAB=student1
ssh -i ~/.ssh/susetech-labs.pem ec2-user@$MYLAB.lab.susetech.org
```

## Lab 1 - kube-bench: Compliance check against CIS benchmark

Steps:

1. Log in to master node

Identify the IP/FQDN of the master node in CaaSP cluster.

```
kubectl get node 
```

The output for my lab is like below.

```
ec2-user@admin-ws:~> kubectl get node
NAME                                            STATUS   ROLES    AGE   VERSION
ip-10-1-1-199.ap-southeast-1.compute.internal   Ready    master   23h   v1.17.4
ip-10-1-4-184.ap-southeast-1.compute.internal   Ready    <none>   23h   v1.17.4
ip-10-1-4-206.ap-southeast-1.compute.internal   Ready    <none>   23h   v1.17.4
```

SSH into the master node with the pem key under ~/install folder of your CaaSP management workstation.

```
ssh -i ~/install/aws.pem ip-10-1-1-199.ap-southeast-1.compute.internal
```

2. Download and install kube-bench

Run the following commands to download and install kube-bench in CaaSP master node.

```
wget https://github.com/aquasecurity/kube-bench/releases/download/v0.3.0/kube-bench_0.3.0_linux_amd64.tar.gz
tar xvf kube-bench_0.3.0_linux_amd64.tar.gz
```

Check the files of kube-bench

```
ec2-user@ip-10-1-1-199:~> ls -l
total 19456
drwxr-xr-x 2 ec2-user users        6 May 25  2018 bin
drwxr-xr-x 7 ec2-user users      121 Jul  8 00:46 cfg
-rwxr-xr-x 1 ec2-user users 13308421 Apr  6 10:45 kube-bench
-rw-r--r-- 1 ec2-user users  6609585 Apr  6 10:45 kube-bench_0.3.0_linux_amd64.tar.gz
```

The bube-bench binary exists now.

Run the following commande to check the CIS benchmark compliance of your CaaSP cluster.

```
sudo ./kube-bench master –version 1.15 -D ./cfg
```

3. Examine the output and discuss what needs to be improved.

4. Run the following command to check worker node compliance.

```
sudo ./kube-bench node –version 1.15 -D ./cfg
```

## Lab 2 - Assess CaaSP security vulnerability with kube-hunter 

Login to CaaSP management workstation to run this lab

1. Install kube-hunter

We need to install pip and upgrade to the latest version first.

```
sudo zypper in python3-pip
sudo pip install --upgrade pip
pip install kube-hunter
```

kube-hunter is installed under `~/.local/bin` folder. Let's add it to the PATH environment variable by running the following command.

```
echo "export PATH=$PATH:$HOME/.local/bin" >> ~/.bashrc
source ~/.bashrc
```

2. Get CaaSP API endpoint URL

```
kubectl cluster-info | grep master
```

The output would be like

```
ec2-user@admin-ws:~> kubectl cluster-info | grep master
Kubernetes master is running at https://example.ap-southeast-1.elb.amazonaws.com:6443
```

3. Run kube-hunter against CaaSP cluster API endpoint URL

```
kube-hunter --remote example.ap-southeast-1.elb.amazonaws.com
```

4. Read the output and discuss what kube-hunter suggested to do.

Here's my output

```
ec2-user@admin-ws:~> kube-hunter --remote example48.ap-southeast-1.elb.amazonaws.com
/usr/lib/python3.6/site-packages/requests/__init__.py:91: RequestsDependencyWarning: urllib3 (1.25.9) or chardet (3.0.4) doesn't match a supported version!
  RequestsDependencyWarning)
2020-07-08 01:05:40,841 INFO kube_hunter.modules.report.collector Started hunting
2020-07-08 01:05:40,841 INFO kube_hunter.modules.report.collector Discovering Open Kubernetes Services
2020-07-08 01:05:48,463 INFO kube_hunter.modules.report.collector Found open service "API Server" at example48.ap-southeast-1.elb.amazonaws.com:6443
2020-07-08 01:05:48,542 INFO kube_hunter.modules.report.collector Found vulnerability "K8s Version Disclosure" in example48.ap-southeast-1.elb.amazonaws.com:6443

Nodes
+-------------+----------------------+
| TYPE        | LOCATION             |
+-------------+----------------------+
| Node/Master | example48            |
|             | 48.ap-southeast-1.el |
|             | b.amazonaws.com      |
+-------------+----------------------+

Detected Services
+------------+----------------------+----------------------+
| SERVICE    | LOCATION             | DESCRIPTION          |
+------------+----------------------+----------------------+
| API Server | example48            | The API server is in |
|            | 48.ap-southeast-1.el | charge of all        |
|            | b.amazonaws.com:6443 | operations on the    |
|            |                      | cluster.             |
+------------+----------------------+----------------------+

Vulnerabilities
For further information about a vulnerability, search its ID in:
https://github.com/aquasecurity/kube-hunter/tree/master/docs/_kb
+--------+----------------------+----------------------+----------------------+----------------------+----------+
| ID     | LOCATION             | CATEGORY             | VULNERABILITY        | DESCRIPTION          | EVIDENCE |
+--------+----------------------+----------------------+----------------------+----------------------+----------+
| KHV002 | example48            | Information          | K8s Version          | The kubernetes       | v1.17.4  |
|        | 48.ap-southeast-1.el | Disclosure           | Disclosure           | version could be     |          |
|        | b.amazonaws.com:6443 |                      |                      | obtained from the    |          |
|        |                      |                      |                      | /version endpoint    |          |
+--------+----------------------+----------------------+----------------------+----------------------+----------+
```

Noted it suggested to hide /version and /metrics endpoint from public access.


## Lab 3 - Limit a user to access to their own namespace only with RBAC

Login to CaaSP management workstation to get started for this lab.

We are going to create a tenant with namespace resource named `tenant1`

1. Create namespace

```
kubectl create ns tenant1
```

Run `kubectl get ns` to verify if the namespace is created for you.

2. Create service account with permissions using RBAC

Create a file `tenant1-access.yml` with the following content.

```
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tenant1-user
  namespace: tenant1

---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: tenant1-user-full-access
  namespace: tenant1
rules:
- apiGroups: ["", "extensions", "apps"]
  resources: ["*"]
  verbs: ["*"]
- apiGroups: ["batch"]
  resources:
  - jobs
  - cronjobs
  verbs: ["*"]

---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: tenant1-user-view
  namespace: tenant1
subjects:
- kind: ServiceAccount
  name: tenant1-user
  namespace: tenant1
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tenant1-user-full-access
```

Run the tenant1-access.yml against your CaaSP cluster

```
kubectl create -f tenant1-access.yaml
```

The output is as below.

```
serviceaccount/tenant1-user created
role.rbac.authorization.k8s.io/tenant1-user-full-access created
rolebinding.rbac.authorization.k8s.io/tenant1-user-view created
```

3. Query the secret of tenant1-user

Run the following command to check the secret token name for tenant1-user

```
$ kubectl describe sa tenant1-user -n tenant1
Name:                tenant1-user
Namespace:           tenant1
Labels:              <none>
Annotations:         <none>
Image pull secrets:  <none>
Mountable secrets:   tenant1-user-token-2269d
Tokens:              tenant1-user-token-2269d
Events:              <none>
```

4. Get the user token and user cert values from the secret

```
export T1-TOKEN=`kubectl get secret tenant1-user-token-2269d -n tenant1 -o "jsonpath={.data.token}"`
export T1-CERT=`kubectl get secret tenant1-user-token-2269d -n tenant1 -o "jsonpath={.data['ca\.crt']}"`
```

Verify these values 

```
echo $T1-TOKEN
echo $T1-CERT
```

5. (Your own excercise) Check how to create a kubeconfig file for this new user and pass to the tenant.

HINT: Use `kubectl config` command.

The kubeconfig file would be like below:

```
apiVersion: v1
kind: Config
preferences: {}

# Define the cluster
clusters:
- cluster:
    certificate-authority-data: CAASP_CA_CERT
    # You'll need the API endpoint of your Cluster here:
    server: https://CAASP_API_ENDPOINT_URL
  name: my-cluster

# Define the user
users:
- name: tenant1-user
  user:
    as-user-extra: {}
    client-key-data: PLACE CERTIFICATE HERE
    token: PLACE USER TOKEN HERE

# Define the context: linking a user to a cluster
contexts:
- context:
    cluster: my-cluster
    namespace: tenant1
    user: tenant1-user
  name: tenant1

# Define current context
current-context: tenant1
```

Then, use this file to connect to CaaSP and see if you can switch to other namespace?


