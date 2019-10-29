import {expect} from "chai";
import {CertificateGenerationService} from "../../src/services/CertificateGenerationService";
import sinon from "sinon";
import techRecordResp from "../resources/tech-records-response.json";
import {AWSError, Lambda, Response} from "aws-sdk";
import {LambdaService} from "../../src/services/LambdaService";

describe("Certificate Generation Service", () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });

  describe("getVehicleMakeAndModel function", () => {
    context("when given a vin with matching record", () => {
      it("should return the record & only invoke the LambdaService once", async () => {
        const LambdaStub = sandbox.stub(LambdaService.prototype, "invoke").resolves(AWSResolve(JSON.stringify(techRecordResp)));
        // @ts-ignore
        const certGenSvc = new CertificateGenerationService(null, new LambdaService(new Lambda()));
        const testResultMock = {
          vin: "abc123"
        };
        const makeAndModel = await certGenSvc.getVehicleMakeAndModel(testResultMock);
        expect(LambdaStub.calledOnce).to.be.true;
        expect(makeAndModel).to.deep.equal({Make: "Plaxton", Model: "Tourismo"});
      });
    });

    context("when given a vin with no matching record but a matching partialVin", () => {
      it("should return the record & invoke the LambdaService twice", async () => {
        const LambdaStub = sandbox.stub(LambdaService.prototype, "invoke")
          .onFirstCall().resolves(AWSReject("no"))
          .onSecondCall().resolves(AWSResolve(JSON.stringify(techRecordResp)));
        // @ts-ignore
        const certGenSvc = new CertificateGenerationService(null, new LambdaService(new Lambda()));
        const testResultMock = {
          vin: "abc123",
          partialVin: "abc123"
        };
        const makeAndModel = await certGenSvc.getVehicleMakeAndModel(testResultMock);
        expect(LambdaStub.calledOnce).to.be.false;
        expect(LambdaStub.calledTwice).to.be.true;
        expect(makeAndModel).to.deep.equal({Make: "Plaxton", Model: "Tourismo"});
      });
    });

    context("when given a vin and partialVin with no matching record but a matching VRM", () => {
      it("should return the record & invoke the LambdaService three times", async () => {
        const LambdaStub = sandbox.stub(LambdaService.prototype, "invoke")
          .onFirstCall().resolves(AWSReject("no"))
          .onSecondCall().resolves(AWSReject("no"))
          .onThirdCall().resolves(AWSResolve(JSON.stringify(techRecordResp)));
        // @ts-ignore
        const certGenSvc = new CertificateGenerationService(null, new LambdaService(new Lambda()));
        const testResultMock = {
          vin: "abc123",
          partialVin: "abc123",
          vrm: "testvrm"
        };
        const makeAndModel = await certGenSvc.getVehicleMakeAndModel(testResultMock);
        expect(LambdaStub.calledOnce).to.be.false;
        expect(LambdaStub.calledTwice).to.be.false;
        expect(LambdaStub.calledThrice).to.be.true;
        expect(makeAndModel).to.deep.equal({Make: "Plaxton", Model: "Tourismo"});
      });
    });

    context("when given a vin, partialVin and VRM with no matching record but a matching TrailerID", () => {
      it("should return the record & invoke the LambdaService four times", async () => {
        const LambdaStub = sandbox.stub(LambdaService.prototype, "invoke")
          .onFirstCall().resolves(AWSReject("no"))
          .onSecondCall().resolves(AWSReject("no"))
          .onThirdCall().resolves(AWSReject("no"))
          .onCall(3).resolves(AWSResolve(JSON.stringify(techRecordResp)));
        // @ts-ignore
        const certGenSvc = new CertificateGenerationService(null, new LambdaService(new Lambda()));
        const testResultMock = {
          vin: "abc123",
          partialVin: "abc123",
          vrm: "testvrm",
          trailerId: "testTrailerId"
        };
        const makeAndModel = await certGenSvc.getVehicleMakeAndModel(testResultMock);
        expect(LambdaStub.callCount).to.equal(4);
        expect(makeAndModel).to.deep.equal({Make: "Plaxton", Model: "Tourismo"});
      });
    });

    context("when given a vehicle details with no matching records", () => {
      it("should call Tech Records Lambda 4 times and then throw an error", async () => {
        const LambdaStub = sandbox.stub(LambdaService.prototype, "invoke").resolves(AWSReject("no"));
        // @ts-ignore
        const certGenSvc = new CertificateGenerationService(null, new LambdaService(new Lambda()));
        const testResultMock = {
          vin: "abc123",
          partialVin: "abc123",
          vrm: "testvrm",
          trailerId: "testTrailerId"
        };
        try {
          await certGenSvc.getVehicleMakeAndModel(testResultMock);
        } catch (e) {
          expect(LambdaStub.callCount).to.equal(4);
          expect(e).to.be.instanceOf(Error);
          expect(e.message).to.equal("Unable to retrieve Tech Record for Test Result");
        }
      });
    });

    context("when given a vehicle details with missing vehicle detail fields and no match", () => {
      it("should call Tech Records Lambda matching number (2) times and then throw an error", async () => {
        const LambdaStub = sandbox.stub(LambdaService.prototype, "invoke").resolves(AWSReject("no"));
        // @ts-ignore
        const certGenSvc = new CertificateGenerationService(null, new LambdaService(new Lambda()));
        const testResultMock = {
          vin: "abc123",
          trailerId: "testTrailerId"
        };
        try {
          await certGenSvc.getVehicleMakeAndModel(testResultMock);
        } catch (e) {
          expect(LambdaStub.callCount).to.equal(2);
          expect(e).to.be.instanceOf(Error);
          expect(e.message).to.equal("Unable to retrieve Tech Record for Test Result");
        }
      });
    });
  });
});

const AWSResolve = (payload: any) => {
  const response = new Response<Lambda.Types.InvocationResponse, AWSError>();
  Object.assign(response, {
    data: {
      StatusCode: 200,
      Payload: payload
    }
  });

  return {
    $response: response,
    StatusCode: 200,
    Payload: payload
  };
};

const AWSReject = (payload: any) => {
  const response = new Response<Lambda.Types.InvocationResponse, AWSError>();
  Object.assign(response, {
    data: {
      StatusCode: 400,
      Payload: payload
    }
  });

  return {
    $response: response,
    StatusCode: 400,
    Payload: payload
  };
};