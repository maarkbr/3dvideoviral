import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { Dividas82, DIVIDAS_FRAMES } from "./videos/dividas/Bridge";

// Uma composição por vídeo. Para um vídeo novo: copie src/videos/bridge para src/videos/<nome> e registre aqui.
export const Root: React.FC = () => (
  <>
    <Composition id="Dividas82" component={Dividas82} durationInFrames={DIVIDAS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
