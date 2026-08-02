/**
 * The package root re-exports the Alibaba Cloud OSS client constructor.
 *
 * The command-line interface remains available through the `aliyunoss-cli`
 * executable. Creating a client does not upload data; network operations begin
 * only when an OSS method such as `put` is called.
 */
import OSS from "ali-oss";

export default OSS;
