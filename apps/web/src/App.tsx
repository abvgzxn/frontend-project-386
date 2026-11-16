import { Badge, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { client, health } from "@call-calendar/api-client";

export function App() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    client.setConfig({ baseUrl: "" });
    health({ throwOnError: true })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <Container size="sm" py={80}>
      <Stack gap="xl">
        <Text c="teal" fw={700} tt="uppercase" size="sm">
          Учебный проект
        </Text>
        <Title order={1}>Календарь звонков</Title>
        <Text c="dimmed" size="lg">
          Каркас сервиса записи на звонки. Бизнес-сценарии подключим следующим шагом.
        </Text>
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="sm">
            <Text fw={600}>Проверка API</Text>
            <Badge
              color={status === "ok" ? "teal" : status === "error" ? "red" : "gray"}
              size="lg"
              variant="light"
            >
              {status === "loading"
                ? "Проверяем..."
                : status === "ok"
                  ? "API доступен"
                  : "API недоступен"}
            </Badge>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
