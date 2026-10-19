import { Stack } from "expo-router";

import AvisosDeEstado from "../componentes/AvisosDeEstado";

export default function RootLayout(){
  return(
    <>
      <AvisosDeEstado />
      <Stack screenOptions={{headerShown:false}}/>
    </>
  );
}
