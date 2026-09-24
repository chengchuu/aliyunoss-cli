declare module "*.png" {
  const url: string;
  export default url;
}

declare module "aliyunoss-cli" {
  import OSS from "ali-oss";
  export = OSS;
}

declare module "bootstrap/js/dist/collapse" {
  interface CollapseInstance {
    hide(): void;
    toggle(): void;
  }

  const Collapse: {
    getOrCreateInstance(
      element: Element,
      options: { toggle: boolean },
    ): CollapseInstance;
  };
  export default Collapse;
}
