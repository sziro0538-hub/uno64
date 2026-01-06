"use client";

import dynamic from "next/dynamic";
import { MapContainerProps } from "react-leaflet";

const MapContainerNoSSR = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.MapContainer })),
  { ssr: false }
);

const TileLayerNoSSR = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.TileLayer })),
  { ssr: false }
);

const MarkerNoSSR = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Marker })),
  { ssr: false }
);

const PopupNoSSR = dynamic(
  () => import("react-leaflet").then((mod) => ({ default: mod.Popup })),
  { ssr: false }
);

export function MapWrapper(props: MapContainerProps) {
  return <MapContainerNoSSR {...props} />;
}

export { TileLayerNoSSR as TileLayer, MarkerNoSSR as Marker, PopupNoSSR as Popup };
