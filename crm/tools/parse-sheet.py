import sqlite3
import pandas
import os

os.chdir(os.path.dirname(__file__))
conn = sqlite3.connect("../scriptfiles/beedb.db")
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS companys (
    uid         INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT,
    email       TEXT,
    phone       TEXT,
    website     TEXT,
    actfield    TEXT,
    insight     TEXT,
    service     TEXT,
    subscribers TEXT)''')

conn.commit()

df = pandas.read_excel('../scriptfiles/contato-clientes-Principal.xlsx', sheet_name='Prospecção')

df_parsed = df[['Empresa', 'Email', 'Telefone', 'Site', 'AreaEmpresa', 'InsightEmpresa', 'ServicoPrincipal', 'Nome']].copy()
df_parsed = df_parsed.rename(columns=
                            {
                                'Empresa': 'name', 
                                'Email': 'email',
                                'Telefone': 'phone',
                                'Site': 'website',
                                'AreaEmpresa': 'actfield',
                                'InsightEmpresa': 'insight',
                                'ServicoPrincipal': 'service',
                                'Nome': 'subscribers'
                            })

for index, row in df_parsed.iterrows():
        
    if(pandas.isna(row['name'])): 
        name = "N/A"
    else:
        name = row['name']
    
    if(pandas.isna(row['email'])): 
        email = "N/A"
    else:
        email = row['email']

    if(pandas.isna(row['phone'])): 
        phone = "N/A"
    else:
        phone = row['phone']

    if(pandas.isna(row['website'])): 
        website = "N/A"
    else:
        website = row['website']

    if(pandas.isna(row['actfield'])): 
        actfield = "N/A"
    else:
        actfield = row['actfield']

    if(pandas.isna(row['insight'])): 
        insight = "N/A"
    else:
        insight = row['insight']

    if(pandas.isna(row['service'])): 
        service = "N/A"
    else:
        service = row['service']

    if(pandas.isna(row['subscribers'])): 
        subscribers = "N/A"
    else:
        subscribers = row['subscribers']    

    cursor.execute('''INSERT INTO companys (name, email, phone, website, actfield, insight, service, subscribers) VALUES (?, ?, ?, ?, ?, ?, ?, ?);''', 
    (name, email, phone, website, actfield, insight, service, subscribers))
    
    conn.commit()

conn.close()