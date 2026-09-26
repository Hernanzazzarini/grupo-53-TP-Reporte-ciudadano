import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

// Campo de texto conectado a react-hook-form.
// Muestra la etiqueta, el input y el error de zod debajo.
type Props<T extends FieldValues> = {
  control: Control<T>;
  nombre: Path<T>;
  etiqueta: string;
} & Omit<TextInputProps, "value" | "onChangeText">;

export default function CampoFormulario<T extends FieldValues>({
  control,
  nombre,
  etiqueta,
  ...inputProps
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={estilos.contenedor}>
          <Text style={estilos.etiqueta}>{etiqueta}</Text>
          <TextInput
            style={[estilos.input, error && estilos.inputError]}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor="#999"
            {...inputProps}
          />
          {error && <Text style={estilos.error}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginBottom: 14 },
  etiqueta: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#d32f2f" },
  error: { color: "#d32f2f", fontSize: 13, marginTop: 4 },
});
