import { handler } from "../../src/handler"
let queueEvent = require("../resources/queue-event.json");
import { expect } from "chai";
import lambdaTester from "lambda-tester";
import { default as sinonRaw } from "sinon";
import {S3BucketService} from "../../src/services/S3BucketService";
import {LambdaService} from "../../src/services/LambdaService";

const sinon = sinonRaw.createSandbox();


describe('Certificate Generation lambda', ()=> {
    context('happy path', () => {
        it("should return a 'certificate'", async () => {
            let event = {...queueEvent};
            sinon.mock(S3BucketService.prototype);
            sinon.mock(LambdaService.prototype);
            const lambda = lambdaTester(handler);
            let response = await lambda.event(event).expectResolve((response: any) => {
                return response;
            });
            expect(response.length).to.equal(2)
        })
    })
});
