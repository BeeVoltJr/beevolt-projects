#!/bin/bash

# Função que será executada quando você apertar Ctrl+C
limpar_tudo() {
    echo -e "\n[Interrompido] Finalizando processos..."
    # Mata o processo do bot usando o PID guardado
    kill $BOT_PID 2>/dev/null
    exit 0
}

# Captura o sinal de interrupção (Ctrl+C) e chama a função limpar_tudo
trap limpar_tudo SIGINT

echo "Iniciando BOT..."
node discord-bot/beea-bot.js &
# Guarda o ID do Processo (PID) do bot que acabou de ser iniciado
BOT_PID=$!

echo "Aguardando BOT ficar online..."
until curl -s http://127.0.0.1:4000/health > /dev/null
do
    sleep 1
done

echo "BOT online!"

echo "Iniciando CRM..."
# Executa o CRM sem o '&' para que ele fique em primeiro plano
node crm/src/server.js