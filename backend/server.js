const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true // GARANTE QUE AS DATAS VENHAM PURAS DO BANCO (SEM DESVIO DE DATA)
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Erro ao ligar ao MySQL: ", err);
    } else {
        console.log("MySQL conectado com sucesso!");
        connection.release();
    }
});

app.get('/api/checkins', (req, res) => {
    db.query('SELECT * FROM check_ins WHERE usuario_id = 1 ORDER BY data DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const formatted = results.map(row => ({
            ...row,
            date: row.data,
            mood: row.humor,
            urge: row.urgencia,
            eatRegular: row.comeu_regularmente,
            sleepWell: row.dormiu_bem,
            symptoms: row.sintomas ? row.sintomas.split(',') : [],
            notes: row.notas || ''
        }));
        res.json(formatted);
    });
});

app.post('/api/checkins', (req, res) => {
    const { data, mood, urge, eatRegular, sleepWell, symptoms, notes } = req.body;
    const sintomasStr = symptoms ? symptoms.join(',') : '';
    
    const sql = `
        INSERT INTO check_ins (usuario_id, data, humor, urgencia, comeu_regularmente, dormiu_bem, sintomas, notas)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE humor=?, urgencia=?, comeu_regularmente=?, dormiu_bem=?, sintomas=?, notas=?
    `;
    
    db.query(sql, [
        data, mood, urge, eatRegular, sleepWell, sintomasStr, notes,
        mood, urge, eatRegular, sleepWell, sintomasStr, notes
    ], (err, result) => {
        if (err) {
            console.error("Erro ao gravar check-in no banco:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Check-in gravado com sucesso!" });
    });
});

app.get('/api/episodes', (req, res) => {
    db.query('SELECT * FROM episodios WHERE usuario_id = 1 ORDER BY data DESC, hora DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const formatted = results.map(row => ({
            ...row,
            date: row.data,
            time: row.hora,
            intensity: row.intensidade,
            triggers: row.gatilhos,
            notes: row.notas || ''
        }));
        res.json(formatted);
    });
});

app.post('/api/episodes', (req, res) => {
    const { date, time, intensity, triggers, notes } = req.body;
    const sql = 'INSERT INTO episodios (usuario_id, data, hora, intensidade, gatilhos, notas) VALUES (1, ?, ?, ?, ?, ?)';
    db.query(sql, [date, time, intensity, triggers, notes], (err, result) => {
        if (err) {
            console.error("Erro ao gravar episódio no banco:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Episódio registrado com sucesso!", id: result.insertId });
    });
});

app.get('/api/recovery-plan', (req, res) => {
    db.query('SELECT * FROM plano_recuperacao WHERE usuario_id = 1 LIMIT 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || {});
    });
});

app.post('/api/recovery-plan', (req, res) => {
    const { triggers, helpers, difficultTimes, reasonToHeal, vulnerableReminder } = req.body;
    const sql = `
        INSERT INTO plano_recuperacao (usuario_id, gatilhos, ajudas, horarios_dificeis, motivo, lembrete)
        VALUES (1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE gatilhos=?, ajudas=?, horarios_dificeis=?, motivo=?, lembrete=?
    `;
    db.query(sql, [
        triggers, helpers, difficultTimes, reasonToHeal, vulnerableReminder,
        triggers, helpers, difficultTimes, reasonToHeal, vulnerableReminder
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Plano de recuperação atualizado!" });
    });
});

app.get('/api/diary', (req, res) => {
    db.query('SELECT * FROM diario WHERE usuario_id = 1 ORDER BY data DESC, id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/diary', (req, res) => {
    const { date, text, prompt } = req.body;
    const sql = 'INSERT INTO diario (usuario_id, data, texto, prompt) VALUES (1, ?, ?, ?)';
    db.query(sql, [date, text, prompt], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Entrada do diário salva!", id: result.insertId });
    });
});

app.get('/api/victories', (req, res) => {
    db.query('SELECT * FROM pequenas_vitorias WHERE usuario_id = 1 ORDER BY data DESC, id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/victories', (req, res) => {
    const { date, title, description, category } = req.body;
    const sql = 'INSERT INTO pequenas_vitorias (usuario_id, data, titulo, descricao, categoria) VALUES (1, ?, ?, ?, ?)';
    db.query(sql, [date, title, description, category], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Vitória registrada!", id: result.insertId });
    });
});

// Buscar todos os treinos
app.get('/api/workouts', (req, res) => {
    db.query('SELECT * FROM treinos WHERE usuario_id = 1', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Salvar/Editar treino de um dia específico
app.post('/api/workouts', (req, res) => {
    const { dia_semana, exercicio, concluido } = req.body;
    const sql = `
        INSERT INTO treinos (usuario_id, dia_semana, exercicio, concluido)
        VALUES (1, ?, ?, ?)
        ON DUPLICATE KEY UPDATE exercicio=?, concluido=?
    `;
    db.query(sql, [dia_semana, exercicio, concluido ? 1 : 0, exercicio, concluido ? 1 : 0], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Treino salvo!" });
    });
});

app.get('/api/challenges', (req, res) => {
    db.query('SELECT * FROM desafios WHERE usuario_id = 1 ORDER BY id DESC', (err, challenges) => {
        if (err) return res.status(500).json({ error: err.message });
        if (challenges.length === 0) return res.json([]);
        
        const challengeIds = challenges.map(c => c.id);
        db.query('SELECT * FROM itens_desafio WHERE desafio_id IN (?)', [challengeIds], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const formatted = challenges.map(c => ({
                id: c.id,
                title: c.titulo,
                startDate: c.data_inicio,
                totalDays: c.total_days,
                currentDay: c.dia_atual,
                description: c.descricao,
                checklist: items
                    .filter(item => item.desafio_id === c.id)
                    .map(item => ({
                        id: item.id,
                        text: item.texto,
                        completed: !!item.concluido
                    }))
            }));
            res.json(formatted);
        });
    });
});

app.post('/api/challenges', (req, res) => {
    const { title, startDate, totalDays, currentDay, description, checklist } = req.body;
    db.query(
        'INSERT INTO desafios (usuario_id, titulo, data_inicio, total_days, dia_atual, descricao) VALUES (1, ?, ?, ?, ?, ?)',
        [title, startDate, totalDays, currentDay || 1, description],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            const desafioId = result.insertId;
            
            if (checklist && checklist.length > 0) {
                const itemValues = checklist.map(item => [desafioId, item.text || item.texto, item.completed ? 1 : 0]);
                db.query(
                    'INSERT INTO itens_desafio (desafio_id, texto, concluido) VALUES ?',
                    [itemValues],
                    (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ message: "Desafio e itens criados com sucesso!", id: desafioId });
                    }
                );
            } else {
                res.json({ message: "Desafio criado sem itens!", id: desafioId });
            }
        }
    );
});

app.delete('/api/challenges/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM desafios WHERE id = ? AND usuario_id = 1', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Desafio excluído com sucesso!" });
    });
});

app.put('/api/challenges/items/:itemId', (req, res) => {
    const { itemId } = req.params;
    const { completed, challengeId } = req.body;

    // 1. Atualiza o status do item clicado
    db.query('UPDATE itens_desafio SET concluido = ? WHERE id = ?', [completed ? 1 : 0, itemId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. Verifica se ainda existem itens pendentes E obtém informações do desafio atual
        db.query('SELECT desafios.dia_atual, desafios.total_days, (SELECT COUNT(*) FROM itens_desafio WHERE desafio_id = ? AND concluido = 0) as pendentes FROM desafios WHERE id = ?', 
        [challengeId, challengeId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: "Desafio não encontrado" });

            const { dia_atual, total_days, pendentes } = results[0];

            // 3. Se pendentes for 0, o dia acabou!
            if (pendentes === 0) {
                // Só avançamos se ainda não tivermos atingido o total de dias
                if (dia_atual < total_days) {
                    db.query('UPDATE desafios SET dia_atual = dia_atual + 1 WHERE id = ?', [challengeId], () => {
                        // Reseta todos os itens para 0 (incompleto) para o próximo dia
                        db.query('UPDATE itens_desafio SET concluido = 0 WHERE desafio_id = ?', [challengeId], () => {
                            res.json({ message: "Dia concluído e avançado!", advanced: true });
                        });
                    });
                } else {
                    // Desafio completo! (Pode adicionar uma lógica de 'status: concluído' se tiver coluna)
                    res.json({ message: "Desafio finalizado com sucesso!", advanced: true, finished: true });
                }
            } else {
                res.json({ message: "Status atualizado!", advanced: false });
            }
        });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando e expandido na porta ${PORT}`));