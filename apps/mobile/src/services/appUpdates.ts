import { Alert, Platform } from "react-native";
import * as Updates from "expo-updates";

let hasCheckedForUpdate = false;

export async function checkForAppUpdate(): Promise<void> {
  if (__DEV__ || Platform.OS === "web" || hasCheckedForUpdate) {
    return;
  }

  hasCheckedForUpdate = true;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      return;
    }

    await Updates.fetchUpdateAsync();

    Alert.alert(
      "Atualização pronta",
      "Uma nova versão do NexusOps foi baixada. Atualize agora para aplicar as melhorias.",
      [
        {
          text: "Depois",
          style: "cancel",
        },
        {
          text: "Atualizar agora",
          onPress: () => {
            void Updates.reloadAsync();
          },
        },
      ],
    );
  } catch (error) {
    console.warn("Não foi possível verificar atualizações do aplicativo.", error);
  }
}
