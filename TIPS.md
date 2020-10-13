# Productivity Tips in Using SUSE CaaSP 4

Below is a collection of useful tips in using SUSE CaaSP 4.

## Simplify kubectl ops by using alias

```
alias k='kubectl '
```

## Browse OCI-compliance container images in SUSE official container image repository

SUSE has an official container image registry URL: https://registry.suse.com

We can use this tool `reg`, a docker registry v2 command line client and repo listing generator with security checks, to examine a list of available images on any OCI-compliant registry.

To install it, follow this [link](https://github.com/genuinetools/reg/releases). Once installed, you can browse the list of images in SUSE registry. For example,

```
# reg -h

reg -  Docker registry v2 client.

Usage: reg <command>

Flags:

  --auth-url           alternate URL for registry authentication (ex. auth.docker.io) (default: <none>)
  -d                   enable debug logging (default: false)
  -f, --force-non-ssl  force allow use of non-ssl (default: false)
  -k, --insecure       do not verify tls certificates (default: false)
  -p, --password       password for the registry (default: <none>)
  --skip-ping          skip pinging the registry while establishing connection (default: false)
  --timeout            timeout for HTTP requests (default: 1m0s)
  -u, --username       username for the registry (default: <none>)

Commands:

  digest    Get the digest for a repository.
  layer     Download a layer for a repository.
  ls        List all repositories.
  manifest  Get the json manifest for a repository.
  rm        Delete a specific reference of a repository.
  server    Run a static UI server for a registry.
  tags      Get the tags for a repository.
  vulns     Get a vulnerability report for a repository from a CoreOS Clair server.
  version   Show the version information.
```

To retrieve a list of images in SUSE registry, run this command:

```
# reg ls registry.suse.com | grep "caasp/v4.5"
INFO[0000] domain: registry.suse.com
INFO[0000] server address: registry.suse.com
caasp/v4.5/389-ds                                1.4.3, 1.4.3-rev2, 1.4.3-rev2-build3.8
caasp/v4.5/busybox                               1.26.2, 1.26.2-rev1, 1.26.2-rev1-build3.8
caasp/v4.5/caasp-dex                             2.23.0, 2.23.0-rev1, 2.23.0-rev1-build3.6
caasp/v4.5/cert-exporter                         2.3.0, 2.3.0-rev1, 2.3.0-rev1-build1.7
caasp/v4.5/cert-manager-cainjector               0.15.1, 0.15.1-rev1, 0.15.1-rev1-build2.19
caasp/v4.5/cert-manager-controller               0.15.1, 0.15.1-rev1, 0.15.1-rev1-build3.7
caasp/v4.5/cert-manager-webhook                  0.15.1, 0.15.1-rev1, 0.15.1-rev1-build3.7
caasp/v4.5/cilium                                1.7.5, 1.7.5-rev2, 1.7.5-rev2-build3.5
caasp/v4.5/cilium-etcd-operator                  2.0.5, 2.0.5-rev1, 2.0.5-rev1-build3.7
caasp/v4.5/cilium-operator                       1.7.5, 1.7.5-rev2, 1.7.5-rev2-build3.9
caasp/v4.5/configmap-reload                      0.3.0, 0.3.0-rev1, 0.3.0-rev1-build3.7
caasp/v4.5/coredns                               1.6.7, 1.6.7-rev1, 1.6.7-rev1-build3.6
caasp/v4.5/curl                                  7.66.0, 7.66.0-rev1, 7.66.0-rev1-build3.7
caasp/v4.5/default-http-backend                  0.15.0, 0.15.0-rev1, 0.15.0-rev1-build2.8
caasp/v4.5/etcd                                  3.4.3, 3.4.3-rev1, 3.4.3-rev1-build3.6
caasp/v4.5/gangway                               3.1.0, 3.1.0-rev5, 3.1.0-rev5-build3.5
caasp/v4.5/grafana                               7.0.3, 7.0.3-rev1, 7.0.3-rev1-build2.6
caasp/v4.5/helm-tiller                           2.16.9, 2.16.9-rev1, 2.16.9-rev1-build3.5
caasp/v4.5/ingress-nginx-controller              0.15.0-rev2, 0.15.0-rev2-build2.5
caasp/v4.5/istio-base                            1.5.4, 1.5.4-rev4, 1.5.4-rev4-build1.16, beta
caasp/v4.5/istio-pilot                           1.5.4, 1.5.4-rev4, 1.5.4-rev4-build2.27, beta
caasp/v4.5/istio-proxyv2                         1.5.4, 1.5.4-rev5, 1.5.4-rev5-build, beta
caasp/v4.5/k8s-sidecar                           0.1.75, 0.1.75-rev1, 0.1.75-rev1-build3.5
caasp/v4.5/kube-apiserver                        v1.18.6, v1.18.6-rev2, v1.18.6-rev2-build3.8
caasp/v4.5/kube-controller-manager               v1.18.6, v1.18.6-rev2, v1.18.6-rev2-build3.8
caasp/v4.5/kube-proxy                            v1.18.6, v1.18.6-rev2, v1.18.6-rev2-build3.8
caasp/v4.5/kube-scheduler                        v1.18.6, v1.18.6-rev2, v1.18.6-rev2-build3.8
caasp/v4.5/kube-state-metrics                    1.9.5, 1.9.5-rev1, 1.9.5-rev1-build3.5
caasp/v4.5/kubernetes-client                     1.18.6, 1.18.6-rev2, 1.18.6-rev2-build3.7
caasp/v4.5/kucero                                1.1.1, 1.1.1-rev2, 1.1.1-rev2-build3.7
caasp/v4.5/kured                                 1.4.3, 1.4.3-rev2, 1.4.3-rev2-build3.7
caasp/v4.5/metrics-server                        0.3.6, 0.3.6-rev1, 0.3.6-rev1-build3.5
caasp/v4.5/pause                                 3.2, 3.2-rev2, 3.2-rev2-build3.4
caasp/v4.5/prometheus-alertmanager               0.16.2, 0.16.2-rev2, 0.16.2-rev2-build3.5
caasp/v4.5/prometheus-node-exporter              0.18.1, 0.18.1-rev2, 0.18.1-rev2-build3.5
caasp/v4.5/prometheus-pushgateway                0.6.0, 0.6.0-rev2, 0.6.0-rev2-build3.5
caasp/v4.5/prometheus-server                     2.18.0, 2.18.0-rev2, 2.18.0-rev2-build3.5
caasp/v4.5/reloader                              0.0.58, 0.0.58-rev1, 0.0.58-rev1-build3.5
caasp/v4.5/rsyslog                               8.39.0, 8.39.0-rev1, 8.39.0-rev1-build3.5
caasp/v4.5/skuba-tooling                         0.1.0, 0.1.0-rev1, 0.1.0-rev1-build3.5
caasp/v4.5/velero                                1.3.1, 1.3.1-rev1, 1.3.1-rev1-build3.4
caasp/v4.5/velero-plugin-for-aws                 1.0.1, 1.0.1-rev1, 1.0.1-rev1-build3.4
caasp/v4.5/velero-plugin-for-gcp                 1.0.1, 1.0.1-rev1, 1.0.1-rev1-build3.4
caasp/v4.5/velero-plugin-for-microsoft-azure     1.0.1, 1.0.1-rev1, 1.0.1-rev1-build3.4
caasp/v4.5/velero-restic-restore-helper          1.3.1, 1.3.1-rev1, 1.3.1-rev1-build3.4
```
