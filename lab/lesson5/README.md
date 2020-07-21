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


