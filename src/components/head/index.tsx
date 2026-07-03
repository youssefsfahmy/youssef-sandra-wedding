import NextHead from "next/head";
import React from "react";

type HeadProps = {
  title?: string;
  description?: string | null;
  image?: string;
  children?: React.ReactNode;
};

const Head: React.FC<HeadProps> = ({ children }) => {
  const defaultDescription =
    "Join us for a celebration by the sea at Dayra Camp — September 19, 2026.";
  const defaultImg = "https://www.youssefxsandra.com/og-image-1.png";

  return (
    <NextHead>
      <title>{"Youssef & Sandra — Wedding · September 19, 2026"}</title>
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://www.youssefxsandra.com/" />
      <meta
        property="og:title"
        content={"Youssef & Sandra — Wedding · September 19, 2026"}
      />
      <meta
        itemProp="name"
        content={"Youssef & Sandra — Wedding · September 19, 2026"}
      />
      <meta itemProp="description" content={defaultDescription} />
      <meta property="og:description" content={defaultDescription} />
      <meta itemProp="image" content={defaultImg} />
      <meta property="og:image" content={defaultImg} />
      <meta property="og:image:secure_url" content={defaultImg} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={defaultImg} />
      <link rel="icon" href="/favicon.ico" />
      {children}
    </NextHead>
  );
};

export default Head;
