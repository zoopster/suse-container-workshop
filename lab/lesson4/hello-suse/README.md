# This folder container the soruce code for docker cotainer `susesamples/hello-suse`

To build this app, let's run

```
docker build -t susesamples/hello-suse:1.0 .
```

Push to docker hub

```
docker login
docker push susesamples/hello-suse:1.0
```


