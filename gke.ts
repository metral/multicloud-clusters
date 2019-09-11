import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

export class GkeCluster extends pulumi.ComponentResource {
    public cluster: gcp.container.Cluster;
    public provider: k8s.Provider;
    public kubeconfig: pulumi.Output<any>;

    constructor(name: string,
                opts: pulumi.ComponentResourceOptions = {}) {
        super("examples:kubernetes-ts-multicloud:GkeCluster", name, {}, opts);

        // Set the engine version.
        const engineVersion = "1.14.3-gke.11";

        // Generate a strong password for the cluster.
        const password = new random.RandomString(`${name}-password`, {
            length: 20,
            special: true
        }, {parent: this, additionalSecretOutputs: ["result"]}).result;

        // Create the GKE cluster.
        const k8sCluster = new gcp.container.Cluster(`${name}`, {
            initialNodeCount: 2,
            nodeVersion: engineVersion,
            podSecurityPolicyConfig: {enabled: true},
            minMasterVersion: engineVersion,
            masterAuth: {username: "example-user", password: password},
            nodeConfig: {
                machineType: "n1-standard-1",
                oauthScopes: [
                    "https://www.googleapis.com/auth/compute",
                    "https://www.googleapis.com/auth/devstorage.read_only",
                    "https://www.googleapis.com/auth/logging.write",
                    "https://www.googleapis.com/auth/monitoring"
                ],
            },
        }, {parent: this});
        this.cluster = k8sCluster;

        // Manufacture a GKE-style Kubeconfig. Note that this is slightly
        // "different" because of the way GKE requires gcloud to be in the
        // picture for cluster authentication (rather than using the client
        // cert/key directly).
        const k8sConfig = pulumi.all([k8sCluster.name, k8sCluster.endpoint, k8sCluster.masterAuth]).apply(
            ([name, endpoint, auth]) => {
            const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
            return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp
`;
        });

        // Export the kubeconfig.
        this.kubeconfig = k8sConfig;

        // Expose a k8s provider instance of the cluster.
        this.provider = new k8s.Provider(`${name}-gke`, {kubeconfig: k8sConfig}, {parent: this});
    }
}

