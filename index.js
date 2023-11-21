const mysql = require('mysql2')
const express = require('express');
const bodyParser = require('body-parser');
const multer =  require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/')// o diretório os as imagens serão
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname) //Nome do arquivo no momento do upload
    }
});
const upload = multer({ storage: storage});

//constante que recebe todas as funções da dependência express
const app = express()
app.use('/uploads', express.static('uploads'));

//bodyParser serve para capturar os dados do formulário html
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'));

//armazena os dados na conexão
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cadastros'
});

//cria a conexão e emite menssagem indicando seu status
connection.connect(function(err){
    if(err){
        console.error('Erro: ',err)
        return
    }
    console.log("Conexão estabelecida com sucesso!")
});

app.get("/",function(req,res){
    res.send(`
    <html>
    <head>
        <link rel="stylesheet" type="text/css"  href="/estilo.css" />
        <title> Cadastro Usuario </title>
    </head>
    <body>
        <h4>Olá, seja bem vindo ao nosso site</h4>
        <h2> Faça o seu cadastro gratuito ou acesse sua conta</h2>
        <p><a href="http://localhost:8081/cadastros"> Cadastrar de Usuario</a></p>
        <p><a href="http://localhost:8081/listar"> Listar Usuários </a></p>
    </body>
    </html>
    `)
})

//Cria uma rota para direcionamento do formulário html
app.get("/cadastros", function(req, res){
    res.sendFile(__dirname + "/cadastros.html")
})
/*
connection.query("INSERT INTO jogadores(usuario,senha,nick,bio,cidade,estado,pais) VALUES (?,?,?,?,?,?,?)", function(err, result){
    if(!err){
        console.log("Dados inseridos com sucesso")
    } else{
        console.log("Erro. Não foi possivel inserir os dados ", err)
    }
});

connection.query("SELECT * FROM jogadores ", function(err, rows, result){
    if(!err){
        console.log("resultados: ", rows)
    }else {
        console.log("Erro: Não foi possivel inserir os dados ",err)
    }
})*/

//Cria rota contendo a função que adiciona os dados ao banco
app.post('/adicionar',upload.single('imagem'), (req, res) =>{

    if(!req.file){
        console.log("Nenhum arquivo enviado");
        res.status(400).send("Nenhum arquivo enviado");
        return;
    }

    const usuario = req.body.usuario;
    const senha = req.body.senha;
    const nick = req.body.nick;
    const bio = req.body.bio;
    const cidade= req.body.cidade;
    const estado= req.body.estado;
    const pais= req.body.pais;
    const imagemPath = req.file.filename;

    const values = [usuario,senha,nick,bio,cidade,estado,imagemPath,pais]
    const insert = "INSERT INTO jogadores(usuario,senha,nick,bio,cidade,estado,imagem_path,pais) VALUES (?,?,?,?,?,?,?,?)"

    connection.query(insert, values, function(err, result){
        if(!err){
            console.log("Dados inseridos com sucesso!");
            res.redirect('/listar');
        } else{
            console.log("Não foi possivel inserir os dados ", err);
            res.send("Erro!")
        }
    })
})

//cria uma rota para listar os dados do banco de dados
app.get("/listar", function(req, res){
    
    // Consulta SQL para selecionar todos os registros da tabela "jogadores"
    const selectAll = "SELECT * FROM jogadores";

    //Executa a consulta do SQL
    connection.query(selectAll, function(err, rows){
        if(!err){
            console.log("Dados inseridos com sucesso!");
            //Envia os resultados como resposta para o cliente
            res.send(`
            <html>
                    <head>
                        <title> Usuários Cadastrados </title>
                        <link rel="stylesheet" type="text/css"  href="/estilo.css" />
                    </head>
                    <body>
                    
                    <p><a href="http://localhost:8081/cadastros"> Cadastrar usuario</a></p>
                   
                        <h3>Usuários Cadastrados</h3>
                        <table>
                            <tr>
                                <th> usuario </th>
                                <th> senha </th>
                                <th> nick </th>
                                <th> bio </th>
                                <th> cidade </th>
                                <th> estado </th>
                                <th> Foto</th>
                                <th> pais </th>
                                <th> Editar </th>
                                <th> Deletar </th>
                            </tr>
                            ${rows.map(row => `
                            <tr>
                                <td>${row.usuario}</td>
                                <td>${row.senha}</td>
                                <td>${row.nick}</td>
                                <td>${row.bio}</td>
                                <td>${row.cidade}</td>
                                <td>${row.estado}</td>
                                <!-- O caminho da imagem agora vem do banco de dados-->
                                <td><img src="/uploads/${row.imagem_path}"
                                alt="Imagem de Perfil" style="width:65px;height:65px;"></td>
                                <td>${row.pais}</td>
                                <td><a href = "/atualizar-form/${row.codigo}"> Editar</a></td>
                                <td><a href = "/deletar/${row.codigo}"> Deletar</a></td>
                            </tr>
                            `).join('')}
                        </table>
                    </body>
            </html>  
        `);
      } else{
            console.log("Erro ao listar dados!", err);
            res.send("Erro!")
    
      }
    })
})


app.get("/deletar/:codigo",function(req,res){
    const codigoDaCidade = req.params.codigo;

    const deleteCidade= "DELETE FROM jogadores WHERE codigo =?";

    connection.query(deleteCidade, [codigoDaCidade],function(err, result){
        if(!err){
            console.log("Informaçao deletada!");
            res.redirect('/listar');
        }else{
            console.log("Erro ao deletar informaçao: ", err);
        }
    })
});
app.get("/atualizar-form/:codigo",function(req,res){
    const codigoDaCidade= req.params.codigo;

    const selectCidade = "SELECT * FROM jogadores WHERE codigo =?";

    connection.query(selectCidade, [codigoDaCidade],function(err, result){
        if(!err && result.length>0){
            const cidade = result[0];

            res.send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <title>Atualizar cadastro</title>
            </head>
                
            <body>

                    <div id="main-container">
                    
                    <h5> Atualizar cadastro </h5>
                    <p><link rel="stylesheet" type="text/css" href="/estilo.css" /></p>
                    <form action="/atualizar/${codigoDaCidade}" method = "POST">

                        <div class="half-box spacing">
                        <label for="usuario">Usuario:</label>
                        <input type="text" id="usuario" name="usuario" value="${cidade.usuario}" required><br>
                        </div>

                        <div class="half-box spacing">
                        <label for="senha">Senha:</label>
                        <input type="text" id="senha" name="senha" value="${cidade.senha}" required><br>
                        </div>

                        <div class="full-box">
                        <label for="nick">Nick:</label>
                        <input type="text" id="nick" name="nick" value="${cidade.nick}" required><br>
                        </div>

                        <div class="full-box">
                        <label for="bio">Bio:</label>
                        <input type="text" id="bio" name="bio" value="${cidade.bio}" required><br>
                        </div>

                        <div class="half-box spacing">
                        <label for="cidade">Cidade:</label>
                        <input type="text" id="cidade" name="cidade" value="${cidade.cidade}" required><br>
                        </div>

                        <div class="half-box spacing">
                        <label for="estado">Estado:</label>
                        <input type="text" id="estado" name="estado" value="${cidade.estado}" required><br>
                        </div>

                        <div class="half-box spacing">
                        <label for="pais">Pais:</label>
                        <input type="text" id="pais" name="pais" value="${cidade.pais}" required><br>
                        </div>

                        <div class="half-box spacing">
                        <label for= "imagem">Imagem de Perfil: </label>
                        <input type="file" id="imagem" name="imagem" accept="image/*"><br>
                        </div>

                        <input type="submit" value="Atualizar">
                    
                </div>
            </body>
            </html>
            `);
        }else {
            console.log("erro ao obter dados do Usuario",err);
        }
    });
});
app.post('/atualizar/:codigo', (req, res)=>{
    const codigo =req.params.codigo;
    const usuario =req.body.usuario;
    const senha =req.body.senha;
    const nick =req.body.nick;
    const bio =req.body.bio;
    const cidade =req.body.cidade;
    const estado =req.body.estado;
    const pais =req.body.pais;

    const updateQuery ="UPDATE jogadores SET  usuario=?, senha=?, nick=?, bio=?, cidade=?, estado=?, pais=? WHERE codigo=?";

    connection.query(updateQuery,[usuario, senha, nick, bio, cidade, estado, pais, codigo], function(err, result){
        if(!err){
            console.log("Dados atualizados");
            res.redirect('/listar');
        }else{
            console.log("Erro ao atualizar dados ", err);
        }
    });
});

//Cria a função que "ouve" a porta do servidor
app.listen(8081, function(){
    console.log("Servidor rodando na url http://localhost:8081")
})