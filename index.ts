import * as pulumi from "@pulumi/pulumi";
import * as aks from "./aks";
import * as eks from "./eks";
import * as gke from "./gke";
import * as local from "./local";

const projectName = pulumi.getProject();

// Create Kubernetes clusters.
const aksCluster = new aks.AksCluster(`${projectName}`);
const eksCluster = new eks.EksCluster(`${projectName}`);
const gkeCluster = new gke.GkeCluster(`${projectName}`);

// Export all kubeconfigs
export const aksStaticAppIp = aksCluster.staticAppIp;
export const aksKubeconfig = aksCluster.kubeconfig;
export const eksKubeconfig = eksCluster.kubeconfig;
export const gkeKubeconfig = gkeCluster.kubeconfig;
export const localKubeconfig = local.localKubeconfig;
export const bmKubeconfig = local.bmKubeconfig;
