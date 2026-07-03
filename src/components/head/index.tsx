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
    "Join us for a barefoot celebration by the sea at Dayra Camp — September 19, 2026.";
  const defaultImg = `/open-couple-photo_1_optimized_300.png`;

  return (
    <NextHead>
      <title>{"Youssef & Sandra — Wedding · September 19, 2026"}</title>
      <meta property="og:type" content="website" />
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
      <link rel="icon" href="/favicon.ico" />
      {children}
    </NextHead>
  );
};

export default Head;
