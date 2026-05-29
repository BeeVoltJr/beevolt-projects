import libs.easyMenu as menu
import pandas as pandas
import numpy  as np
import seaborn as sea
import matplotlib.pyplot as plt

main_file    = "horarios-2026-1.xlsx"
master_sheet = "Horário geral"

def print_array(array, max_cell_size):

    for line in array:
        for element in line:
            print(element, end=" " * (max_cell_size - len(str(element))) + "\t")
        print()

def transform_data(member_array):

    copy_array = member_array.copy()

    for i in range(len(member_array)):
        for j in range(len(member_array[i])):
            match member_array[i][j]:
                case "Livre":
                    copy_array[i][j] = 0.25
                case "BeeVolt":
                    copy_array[i][j] = 0.5
                case "Flexível":
                    copy_array[i][j] = 0.75
                case "Reunião Geral":
                    copy_array[i][j] = 1.0
                case _:
                    copy_array[i][j] = 0.0

    return copy_array

def GetMemberTemperatureArray(sheet, member_name):

    member_dataframe = sheet[member_name].copy()

    member_dataframe = member_dataframe.iloc[:22, :]

    member_dataframe = member_dataframe.iloc[:, :7]

    member_array = member_dataframe.to_numpy().tolist()

    return transform_data(member_array)

def PlotHeatmap(avarage_temperature, week_days, day_hour):

    sea.heatmap(
        avarage_temperature,
        annot = True,
        cmap = "Reds",
        vmin = 0,
        vmax =  1,
        xticklabels = week_days,
        yticklabels = day_hour,
        cbar = True
    )

    plt.gca().xaxis.tick_top()
    plt.gca().xaxis.set_label_position('top')

    plt.xlabel("Dias da Semana")
    plt.ylabel("Horários")
    plt.title("Disponibilidade Média para Reuniões")

    plt.show()

def ComputeAvarageTemperature(sheet):
    
    count = 0

    array_tempetature = np.zeros((22, 7))

    for name in sheet.keys():
        if(name == master_sheet): continue

        print(f"Processando tabela de {name}...")
        array_tempetature += GetMemberTemperatureArray(sheet, name)

        count += 1
    
    avarage_temperature = [
        [element / count for element in linha]
        for linha in array_tempetature
    ]

    return avarage_temperature

def main():

    menu.init()

    global master_sheet

    sheet = pandas.read_excel(main_file, sheet_name=None)

    #------

    sample= sheet[master_sheet].copy()
    day_hour = sample.iloc[:22]["Horário"].tolist()
    week_days = sample.iloc[:, :7].keys().tolist()

    #------

    avarage_temperature = ComputeAvarageTemperature(sheet)

    print_array(avarage_temperature, 19)

    PlotHeatmap(avarage_temperature, week_days, day_hour)


if __name__ == "__main__":
    main()   