import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import CampoFormulario from "../componentes/CampoFormulario";
import { actualizarPerfil, obtenerUsuarioActual } from "../servicios/usuarios";
import { PerfilForm, perfilSchema } from "../utilidades/validacionesUsuario";
import BotonVolver from "../componentes/BotonVolver";

export default function PantallaPerfil() {
  const usuario = obtenerUsuarioActual();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty }, // isDirty: ¿el vecino cambió algo?
    reset,
  } = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    // Precarga el formulario con los datos que trajo la API
    defaultValues: {
      nombre: usuario?.nombre ?? "",
      telefono: usuario?.telefono ?? "",
    },
  });

  // Si no hay sesión, mandamos al login (va después de los hooks)
  if (!usuario) return <Redirect href="/login" />;

  const onSubmit = async (datos: PerfilForm) => {
    setMensaje(null);
    try {
      const actualizado = await actualizarPerfil(datos); // PATCH /yo
      // Los datos guardados pasan a ser el nuevo punto de partida
      reset({ nombre: actualizado.nombre, telefono: actualizado.telefono ?? "" });
      setMensaje("✅ Datos guardados");
    } catch (e) {
      const error = e as { mensaje?: string; message?: string };
      setMensaje(error.mensaje ?? error.message ?? "Ocurrió un error inesperado");
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <BotonVolver />
      <Text style={estilos.titulo}>Mi perfil</Text>

      {/* Datos que no se pueden editar */}
      <View style={estilos.tarjeta}>
        <Text style={estilos.dato}>Email: {usuario.email}</Text>
        <Text style={estilos.dato}>Cuenta: {usuario.rol}</Text>
      </View>

      <CampoFormulario control={control} nombre="nombre" etiqueta="Nombre y apellido" />
      <CampoFormulario
        control={control}
        nombre="telefono"
        etiqueta="Teléfono (opcional)"
        keyboardType="phone-pad"
      />

      {mensaje && <Text style={estilos.mensaje}>{mensaje}</Text>}

      {/* Desactivado si no hubo cambios o si está guardando */}
      <Pressable
        style={[estilos.boton, (!isDirty || isSubmitting) && estilos.botonDeshabilitado]}
        onPress={handleSubmit(onSubmit)}
        disabled={!isDirty || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={estilos.textoBoton}>Guardar cambios</Text>
        )}
      </Pressable>

      <Link href="/configuracion" style={estilos.enlace}>
        ⚙️ Configuración
      </Link>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 24 },
  titulo: { fontSize: 26, fontWeight: "700", marginBottom: 16 },
  tarjeta: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  dato: { fontSize: 15, color: "#444", marginBottom: 4 },
  boton: {
    backgroundColor: "#1565c0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.5 },
  textoBoton: { color: "#fff", fontSize: 16, fontWeight: "600" },
  mensaje: { textAlign: "center", marginBottom: 8 },
  enlace: { color: "#1565c0", textAlign: "center", marginTop: 24 },
});