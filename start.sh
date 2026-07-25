#!/bin/bash

cleanup() {
    echo -e "\nEncerrando processos..."
    kill $(jobs -p) 2>/dev/null
    wait
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "Iniciando sistema BeeVolt ⚡ ...\n"

echo -e "Iniciando beea-bot/index.js...\n"

node packages/discord-bot/index.js &

echo -e "Aguardando Beea ficar online...\n"

until curl -s http://127.0.0.1:4000/health > /dev/null
do
    sleep 1
done

echo -e "Beea ficou online com sucesso!\n"

echo -e "Iniciando crm-sheets/index.js...\n"

node packages/crm-sheets/index.js &

echo -e "Sistema BeeVolt ⚡ inicializado com sucesso\n"

wait