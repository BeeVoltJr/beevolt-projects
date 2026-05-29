function verificarLeadsOrganizado() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
    
  const abaProspec = ss.getSheetByName("Prospecção");
  const abaAtivos = ss.getSheetByName("Leads_Ativos");
  const abaFollow = ss.getSheetByName("Follow_Ups");

  if (!abaProspec || !abaAtivos || !abaFollow) {
    throw new Error("Uma das abas não foi encontrada.");
  }

  const dados = abaProspec.getDataRange().getValues();

  const COL_EMPRESA = 0;
  const COL_DATA = 1;
  const COL_TELEFONE = 3;
  const COL_SITE = 4;
  const COL_ACAO = 9;
  const COL_STATUS = 10;
  const COL_NOTIFICADO = 11;

  const COL_FU1 = 12;
  const COL_FU2 = 13;
  const COL_FU3 = 14;
  const COL_HISTORICO = 18; // 🔥 AJUSTADO (não conflita mais)

  let urgentes = [];
  let quentes = [];
  let followups = [];
  let respondidos = [];

  let rankingAtivos = [];
  let rankingFollow = [];

  let hoje = new Date();

  for (let i = 1; i < dados.length; i++) {

    let empresa = dados[i][COL_EMPRESA];
    let telefone = dados[i][COL_TELEFONE];
    let site = dados[i][COL_SITE];
    let status = dados[i][COL_STATUS];
    let acao = dados[i][COL_ACAO];
    let notificado = dados[i][COL_NOTIFICADO];

    let dataEnvio = dados[i][COL_DATA];
    let fu1 = dados[i][COL_FU1];
    let fu2 = dados[i][COL_FU2];
    let fu3 = dados[i][COL_FU3];

    let historico = dados[i][COL_HISTORICO] || "";

    let linha = i + 1;
    let aba = abaProspec.getName();

    let texto = `${empresa} | ${telefone} | ${site} | ${aba} | Linha ${linha}`;

    // 🔒 BLOQUEIO FOLLOW-UP RECENTE (<2 dias)
    let bloqueado = false;
    [fu1, fu2, fu3].forEach(fu => {
      if (fu instanceof Date) {
        let dias = (hoje - fu) / (1000 * 60 * 60 * 24);
        if (Math.floor(dias) < 2) bloqueado = true;
      }
    });
    if (bloqueado) continue;

    // 🧠 CONTROLE POR DATA (anti-spam inteligente)
    let jaNotificadoRecente = false;
    if (notificado instanceof Date) {
      let dias = (hoje - notificado) / (1000 * 60 * 60 * 24);
      if (dias < 2) jaNotificadoRecente = true;
    }

    // 🧠 ATUALIZA HISTÓRICO (sem mexer nas colunas YAMM)
    if (status && !historico.includes(status)) {
      let novo = `${status} (${new Date().toLocaleDateString()})`;
      abaProspec.getRange(linha, COL_HISTORICO + 1)
        .setValue(historico ? historico + " | " + novo : novo);
    }

    // 🚨 ALERTA INSTANTÂNEO (CLICK)
    if (status === "EMAIL_CLICKED" && !jaNotificadoRecente) {

      MailApp.sendEmail({
        to: "seuemail@gmail.com",
        subject: "🔥 LEAD QUENTE AGORA!",
        body: `👀 LEAD CLICOU:\n\n${texto}`
      });

      abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
    }

    // 🧠 SCORE INTELIGENTE
    let score = 0;

    if (status === "EMAIL_CLICKED") score += 100;
    else if (status === "EMAIL_OPENED") score += 70;
    else if (status === "EMAIL_SENT") score += 40;

    if (dataEnvio instanceof Date) {
      let dias = (hoje - dataEnvio) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 30 - dias);
    }

    // 🔥 URGENTE
    if (acao === "Ligar Urgente") {

      if (!jaNotificadoRecente) {
        urgentes.push(`🔥 ${texto}`);
        abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
      }

      rankingAtivos.push({ score, texto });
      continue;
    }

    // 📞 QUENTE
    if (acao === "Ligar") {

      if (!jaNotificadoRecente) {
        quentes.push(`📞 ${texto}`);
        abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
      }

      rankingAtivos.push({ score, texto });
      continue;
    }

    // 👀 INTERAÇÃO
    if (["EMAIL_CLICKED", "EMAIL_OPENED"].includes(status)) {

      if (!jaNotificadoRecente) {
        respondidos.push(`👀 INTERAGIRAM: ${texto}`);
        abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
      }

      rankingAtivos.push({ score, texto });
      continue;
    }

    // ✅ RESPONDEU
    if (status === "RESPONDED") {

      if (!jaNotificadoRecente) {
        respondidos.push(`✅ ${texto}`);
        abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
      }

      continue;
    }

    // 🔵 FOLLOW-UP
    if (["EMAIL_SENT", "EMAIL_OPENED", "EMAIL_CLICKED"].includes(status)) {

      if (dataEnvio instanceof Date && !fu1) {
        let dias = (hoje - dataEnvio) / (1000 * 60 * 60 * 24);

        if (dias >= 3) {
          if (!jaNotificadoRecente) {
            followups.push(`🔵 FU1: ${texto}`);
            abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
          }
          rankingFollow.push({ score, texto });
          continue;
        }
      }

      if (fu1 instanceof Date && !fu2) {
        let dias = (hoje - fu1) / (1000 * 60 * 60 * 24);

        if (dias >= 5) {
          if (!jaNotificadoRecente) {
            followups.push(`🟣 FU2: ${texto}`);
            abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
          }
          rankingFollow.push({ score, texto });
          continue;
        }
      }

      if (fu2 instanceof Date && !fu3) {
        let dias = (hoje - fu2) / (1000 * 60 * 60 * 24);

        if (dias >= 8) {
          if (!jaNotificadoRecente) {
            followups.push(`🔴 FU3: ${texto}`);
            abaProspec.getRange(linha, COL_NOTIFICADO + 1).setValue(new Date());
          }
          rankingFollow.push({ score, texto });
          continue;
        }
      }
    }
  }

  // 🔝 RANKINGS
  rankingAtivos.sort((a, b) => b.score - a.score);
  rankingFollow.sort((a, b) => b.score - a.score);

  rankingAtivos = rankingAtivos.slice(0, 10);
  rankingFollow = rankingFollow.slice(0, 10);

  let mensagem = "";

  if (urgentes.length > 0)
    mensagem += "🔥 LEADS URGENTES:\n\n" + urgentes.join("\n") + "\n\n";

  if (quentes.length > 0)
    mensagem += "📞 LEADS QUENTES:\n\n" + quentes.join("\n") + "\n\n";

  if (followups.length > 0)
    mensagem += "🔵 FOLLOW-UPS:\n\n" + followups.join("\n") + "\n\n";

  if (respondidos.length > 0)
    mensagem += "👀 INTERAÇÕES:\n\n" + respondidos.join("\n") + "\n\n";

  mensagem += "🏆 RANKING ATIVOS:\n\n";
  rankingAtivos.forEach((l, i) => {
    mensagem += `${i + 1}. (${Math.round(l.score)}) ${l.texto}\n`;
  });

  mensagem += "\n📊 RANKING FOLLOW-UP:\n\n";
  rankingFollow.forEach((l, i) => {
    mensagem += `${i + 1}. (${Math.round(l.score)}) ${l.texto}\n`;
  });

  const pdfProspec = exportarAbaComoPDF(abaProspec, "Prospecção");
  Utilities.sleep(2000);
  const pdfAtivos = exportarAbaComoPDF(abaAtivos, "Leads_Ativos");
  Utilities.sleep(2000);
  const pdfFollow = exportarAbaComoPDF(abaFollow, "Follow_Ups");

  if (mensagem !== "") {
    MailApp.sendEmail({
      to: "comercial@beevoltjr.com.br",
      subject: "🚀 Painel Leads BeeVolt",
      body: mensagem,
      attachments: [pdfProspec, pdfAtivos, pdfFollow]
    });
  }
}

function exportarAbaComoPDF(sheet, nomeArquivo) {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const url = ss.getUrl().replace(/edit$/, '');

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  function getColumnLetter(col) {
    let letter = '';
    while (col > 0) {
      let temp = (col - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      col = (col - temp - 1) / 26;
    }
    return letter;
  }

  const range = `A1:${getColumnLetter(lastCol)}${lastRow}`;

  const exportUrl =
    url + 'export?format=pdf' +
    '&gid=' + sheet.getSheetId() +
    '&range=' + range +
    '&portrait=true' +
    '&size=A4' +
    '&fitw=true' +
    '&sheetnames=false' +
    '&printtitle=false' +
    '&pagenumbers=false' +
    '&gridlines=false';

  const token = ScriptApp.getOAuthToken();

  // 🔁 TENTA ATÉ 3 VEZES
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {

      const response = UrlFetchApp.fetch(exportUrl, {
        headers: { Authorization: 'Bearer ' + token }
      });

      const blob = response.getBlob();
      blob.setName(nomeArquivo + ".pdf");

      return blob;

    } catch (e) {
      Utilities.sleep(2000); // espera antes de tentar de novo
    }
  }

  throw new Error("Falha ao exportar PDF após 3 tentativas.");
}

verificarLeadsOrganizado();