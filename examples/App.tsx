import { FormEvent, useState } from "react";
import OSS from "aliyunoss-cli";

interface PlaygroundResult {
  bucket: string;
  region: string;
  secure: boolean;
  timeout: number;
}

export function App() {
  const [region, setRegion] = useState("oss-cn-hangzhou");
  const [bucket, setBucket] = useState("example-bucket");
  const [timeout, setTimeoutValue] = useState("60000");
  const [secure, setSecure] = useState(true);
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResult(null);
    const trimmedRegion = region.trim();
    const trimmedBucket = bucket.trim();
    const timeoutValue = Number(timeout);
    if (!trimmedRegion || !trimmedBucket) {
      setError("Region and bucket are required.");
      return;
    }
    if (
      !Number.isInteger(timeoutValue) ||
      timeoutValue < 1000 ||
      timeoutValue > 120000
    ) {
      setError("Timeout must be an integer from 1000 to 120000 milliseconds.");
      return;
    }

    try {
      new OSS({
        region: trimmedRegion,
        bucket: trimmedBucket,
        accessKeyId: "playground-access-key-id",
        accessKeySecret: "playground-access-key-secret",
        secure,
        timeout: timeoutValue,
      });
      setResult({
        region: trimmedRegion,
        bucket: trimmedBucket,
        secure,
        timeout: timeoutValue,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The client could not be created.",
      );
    }
  };

  return (
    <div className="playground-panel">
      <form className="row g-3" onSubmit={handleSubmit} noValidate>
        <div className="col-md-6">
          <label className="form-label" htmlFor="oss-region">
            OSS region
          </label>
          <input
            id="oss-region"
            className="form-control"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            required
            aria-describedby="region-help"
          />
          <div id="region-help" className="form-text">
            Example: <code>oss-cn-hangzhou</code>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="oss-bucket">
            Bucket
          </label>
          <input
            id="oss-bucket"
            className="form-control"
            value={bucket}
            onChange={(event) => setBucket(event.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="oss-timeout">
            Timeout in milliseconds
          </label>
          <input
            id="oss-timeout"
            className="form-control"
            type="number"
            min="1000"
            max="120000"
            step="1000"
            value={timeout}
            onChange={(event) => setTimeoutValue(event.target.value)}
            required
          />
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <div className="form-check mb-2">
            <input
              id="oss-secure"
              className="form-check-input"
              type="checkbox"
              checked={secure}
              onChange={(event) => setSecure(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="oss-secure">
              Use HTTPS
            </label>
          </div>
        </div>
        <div className="col-12">
          <button className="btn btn-primary" type="submit">
            Create client configuration
          </button>
        </div>
      </form>
      <div className="playground-feedback mt-4" aria-live="polite">
        {error && (
          <p className="alert alert-danger mb-0" role="alert">
            {error}
          </p>
        )}
        {result && (
          <section className="result-card" aria-labelledby="result-title">
            <h2 id="result-title" className="h5">
              Safe client configuration
            </h2>
            <dl className="row mb-0">
              <dt className="col-sm-4">Region</dt>
              <dd className="col-sm-8">
                <code>{result.region}</code>
              </dd>
              <dt className="col-sm-4">Bucket</dt>
              <dd className="col-sm-8">
                <code>{result.bucket}</code>
              </dd>
              <dt className="col-sm-4">HTTPS</dt>
              <dd className="col-sm-8">
                {result.secure ? "Enabled" : "Disabled"}
              </dd>
              <dt className="col-sm-4">Timeout</dt>
              <dd className="col-sm-8">{result.timeout} ms</dd>
            </dl>
            <p className="mb-0 mt-2 text-muted-custom">
              No credentials are displayed, and no OSS operation was called.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
