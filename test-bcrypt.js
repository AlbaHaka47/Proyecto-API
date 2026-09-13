const bcrypt = require('bcrypt');

async function probar() {
    const password = '123456';

    const hash = await bcrypt.hash(password, 10);

    console.log('Contraseña:', password);
    console.log('Hash:', hash);
}

probar();