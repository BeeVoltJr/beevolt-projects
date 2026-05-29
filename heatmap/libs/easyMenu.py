# ************************************************************
# *                                                          *
# *                          ___  ___                        *
# *                          |  \/  |                        *
# *     ___  __ _ ___ _   _  | .  . | ___ _ __  _   _ ___    *
# *    / _ \/ _` / __| | | | | |\/| |/ _ \ '_ \| | | / __|   *
# *   |  __/ (_| \__ \ |_| | | |  | |  __/ | | | |_| \__ \   *
# *    \___|\__,_|___/\__, | \_|  |_/\___|_| |_|\__,_|___/   *
# *                    __/ |                                 *
# *                   |___/                                  *
# *                                                          *
# ************************************************************
#
#   MACROS - INTERFACE DE MENUS
#
WAITING_TIME_MS                 = (3000)                            # Tempo (ms) de espera
MAX_TEXT_LEN                    = (256)                             # Tamanho máximo do terminal input
COMMAND_PREFIX                  = '/'                               # Prefixo que identifica os comandos digitados
COMMAND_MENU                    = 'menu'                            # Comando voltar p/ Menu Principal 
COMMAND_QUIT                    = 'quit'                            # Comando encerrar programa
COMMAND_RELOAD                  = 'reload'                          # Comando reiniciar programa
TERMINAL_INPUT_MSG_INT          = '\n[ » ] Selecione uma opção: '   # Menssagem de solicitação de input para números
TERMINAL_INPUT_MSG_STRING       = '\n[ » ] Insira um texto: '       # Menssagem de solicitação de input para texto
TERMINAL_WIDTH                  = (120)                             # Largura do terminal em "_"
DIR_DEFAULT                     = 'scriptfiles'                     # Nome da pasta de arquivos de código
FILE_ENCODING                   = 'utf-8'                           # Unicode dos arquivos do menu
#
#   CONSTS
#
TYPE_INT                        = (0x10)                            # flag do tipo 'int'
TYPE_STRING                     = (0x20)                            # flag do tipo 'texto'
TYPE_CONFIRM                    = (0x30)                            # flag do tipo 'confirmar'
INPUT_CMD                       = (0x80)                            # flag do tipo 'comando'
INVALID_INPUT_INT               = (-1)                              # flag para 'input númerico inválido'
INVALID_INPUT_STRING            = 'null'                            # flag para 'input texto inválido' 
ERROR_VALUE                     = 0xEE                              # Valor de retorno p/ 'erro'
SUCESS_VALUE                    = 0xAA                              # Valor de retorno p/ 'sucesso'       
REMOVE_KEY_VALUE                = 0xDD                              # Valor que identifica remoção de chave no dictio     
#
#   BIBLIOTECAS - INTERFACE DE MENUS
#                                                         
import os
import platform
import time
import sys 
#
#   VARIÁVEIS GLOBAL - INTERFACE DE MENUS
#
input_name  = ''        # Variável global - armazena o input do Nome digitado
#
#   FUNÇÕES - INTERFACE DE MENUS
#
#   'ClearTerminal()' limpa o terminal
def ClearTerminal():
    os.system('cls' if platform.system() == 'Windows' else 'clear')
#
#   'KillTerminal()' finaliza o programa
def KillTerminal():
    sys.exit()
#
#   'TerminalDelay(ms)' deixa o programa em delay durante 'ms' milessegundos
def TerminalDelay(ms):      
    time.sleep(ms / 1000)
#
#   'GetTerminalBounds(width)' imprime as bordas da interface do programa com largura = 'width'
def GetTerminalBounds(width = TERMINAL_WIDTH): 
    return ("_" * width + "\n")
#
#   'SendTerminalCommand(cmd)' envia um comando 'cmd'(sem o prefixo) para o terminal'
def SendTerminalCommand(cmd):
    #   /menu
    if cmd == COMMAND_MENU:
        TerminalDelay(500)
        ClearTerminal()
        CreateTerminalMenu(MENU_MAIN)
    #   /quit
    if cmd == COMMAND_QUIT:
        ClearTerminal()
        print("\n[ » ] Encerrando programa...\n")
        TerminalDelay(WAITING_TIME_MS)
        ClearTerminal()
        print("\n[ » ] Programa encerrado\n")
        KillTerminal()
    #   /reload
    if cmd == COMMAND_RELOAD:
        TerminalDelay(WAITING_TIME_MS)
        ClearTerminal()
        print("\n[ » ] Reiniciando programa...\n")
        TerminalDelay(WAITING_TIME_MS)
        main()
    else:
        return 0
#
#   'SendTerminalWarning(msg)' envia uma mensagem de alerta a'msg' para o terminal'
def SendTerminalWarning(msg):
    ClearTerminal()
    print(GetTerminalBounds() + "\n" + "Alerta".center(TERMINAL_WIDTH) + '\n\n' + msg + '\n' + GetTerminalBounds())
    TerminalDelay(WAITING_TIME_MS)
    SendTerminalCommand(COMMAND_QUIT)
#
#   'SendTerminalMessage(msg)' envia uma mensagem 'msg' para o terminal'
def SendTerminalMessage(msg, flag = True):
    print('\n' + msg)
    if flag:
        print(GetTerminalBounds())
        TerminalDelay(WAITING_TIME_MS * 0.3)
#
#   'GetTerminalInput()' trata as entradas digitadas: tipo arquivo, número e texto'
def GetTerminalInput(input_msg, input_type, min_range = -1, max_range = -1, len_txt = MAX_TEXT_LEN):
    default_msg = input_msg
    if input_type == TYPE_INT:
        while True:
            input_txt = input(input_msg + default_msg if default_msg != input_msg else input_msg)
            if '/' in input_txt: 
                if SendTerminalCommand(input_txt.removeprefix(COMMAND_PREFIX)):
                    return INPUT_CMD
                else: 
                    input_msg = f"\n[ x ] O comando digitado NÃO EXISTE. Tente novamente\n" + GetTerminalBounds()
                    continue
            if not input_txt.isnumeric():
                input_msg = f"\n[ x ] Entrada INVÁLIDA. Digite um NÚMERO INTEIRO entre {min_range} e {max_range}.\n" + GetTerminalBounds()
                continue
            input_value = int(input_txt)
            if min_range != max_range:
                if (input_value < min_range or input_value > max_range):    
                    input_msg = f"\n[ x ] Entrada INVÁLIDA. Digite UM VALOR entre {min_range} e {max_range}.\n"
                    continue
            if min_range == max_range:
                if (input_value != min_range) and min_range != -1:    
                    input_msg = f"\n[ x ] Entrada INVÁLIDA. Só há UMA OPÇÃO {min_range}.\n" + GetTerminalBounds()
                    continue
            return input_value
    if input_type == TYPE_STRING:
        while True:
            input_txt = input(input_msg + default_msg if default_msg != input_msg else input_msg)
            if '/' in input_txt: 
                if SendTerminalCommand(input_txt.removeprefix(COMMAND_PREFIX)):
                    return INPUT_CMD
                else: 
                    input_msg = f"\n[ x ] O comando digitado NÃO EXISTE. Tente novamente\n" + GetTerminalBounds()
                    continue
            if(len(input_txt) > len_txt):
                input_msg = f"\n[ x ] Entrada INVÁLIDA. Escreva UM TEXTO com no MÁXIMO {MAX_TEXT_LEN} caracteres:\n" + GetTerminalBounds()
                continue
            return input_txt
#
#   'SendTermialInput(msg, typeinput, menuid, min, max)'
#
#   Envia uma mensagem e um campo para inserir uma entrada (input) na interface. A qual é analisada
#   posteriormente em 'GetTerminalInput(input_msg, typevar, min_range, max_range, len_txt)'
#
def SendTermialInput(msg, input_type, menuid = 0, min = -1, max = -1, len_txt = MAX_TEXT_LEN):
    if input_type == TYPE_INT:
        input_value = INVALID_INPUT_INT
        while True:
            input_value = GetTerminalInput(msg, input_type, min_range = min, max_range = max)
            if input_value == INPUT_CMD: return 1
            else:  
                return SendMenuResponse(menuid, input_value)
    if input_type == TYPE_STRING:
        input_txt = INVALID_INPUT_STRING
        while True:
            input_txt = GetTerminalInput(msg, input_type, min, max, len_txt)
            if input_txt == INPUT_CMD: return 1
            else: 
                return SendMenuResponse(menuid, input_txt)
    if input_type == TYPE_CONFIRM:
        input_value = INVALID_INPUT_INT
        while True:
            input_value = input(msg + '\n' + TERMINAL_INPUT_MSG_INT)
            if '/' in input_value: 
                if SendTerminalCommand(input_value.removeprefix(COMMAND_PREFIX)):
                    return 1
            if(input_value == '1' or input_value == '2'):
                break
            else:
                msg ="\n" + GetTerminalBounds() + f"\n[ x ] Digite APENAS ({min}) ou ({max})\n"
        return int(input_value)
#
#   'CreateTerminalMenu(menuid)' cria o menu de acordo com os arquivos .txt dentros da pasta 'menus'
def CreateTerminalMenu(menuid):
    ClearTerminal()
    txt = ''
    try:            
        file = open(f"menus/menu-{menuid}.txt", 'rt', encoding = FILE_ENCODING)
    except IOError: 
        SendTerminalWarning(f"[ x ] NÃO foi possível CARREGAR \"menus/menu-{menuid}.txt\"")
        return ERROR_VALUE
    else:
        global input_name
        for line in file:
            line = line.replace('\n', "")
            line = line.replace('<br>', "\n")
            line = line.replace('<t>', "\t")
            line = line.replace('<name>', f'{input_name}')
            if '<center>' in line:
                line = line.replace('<center>', "")
                line = line.center(TERMINAL_WIDTH)
            if '<left>' in line:
                line = line.replace('<left>', "")
                line = line.ljust(TERMINAL_WIDTH)
            if '<right>' in line:
                line = line.replace('<right>', "")
                line = line.rjust(TERMINAL_WIDTH)
            if '<bounds>' in line:
                line = GetTerminalBounds(TERMINAL_WIDTH)
            if line == "<request-input-str>" or line == "<request-input-int>":
                continue
            txt += line
    print(txt, end = '')
    file.close()
    if line == "<request-input-str>":
        SendTermialInput(TERMINAL_INPUT_MSG_STRING, TYPE_STRING, menuid, len_txt = 64)
    elif line == "<request-input-int>":
        SendTermialInput(TERMINAL_INPUT_MSG_INT, TYPE_INT, menuid, 1, 6)
    elif line == "<bounds>":
        print(GetTerminalBounds())

def init():
    os.chdir(os.path.dirname("libs/"))
    CreateTerminalMenu(1)
    input("Aperte ENTER para iniciar o programa: ")
    CreateTerminalMenu(2)  
