import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => 
{
    console.log(`[ BACKEND ] Servidor iniciado na porta ${PORT}`);
});

function shutdown(signal) 
{
    console.log(`\n[ BACKEND ] Recebido ${signal}. Encerrando...`);

    server.close(() => 
    {
        console.log('[ BACKEND ] Servidor encerrado.');
        process.exit(0);
    });

}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));