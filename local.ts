import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
var fs = require("fs");

// Read local client's KUBECONFIG.
var data = fs.readFileSync(process.env.KUBECONFIG);
export const localKubeconfig: pulumi.Output<any> = pulumi.output(data.toString());

// Read local client's BETTER_MIKE.
var bmData = fs.readFileSync(process.env.BETTER_MIKE);
export const bmKubeconfig: pulumi.Output<any> = pulumi.output(bmData.toString());
