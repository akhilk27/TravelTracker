CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL
);

CREATE TABLE states (
    state_code VARCHAR(2) PRIMARY KEY,
    state_name VARCHAR(255) NOT NULL
);

CREATE TABLE visited_states_grp (
    id SERIAL PRIMARY KEY,
    state_code VARCHAR(2) REFERENCES states(state_code),
    user_id INT REFERENCES users(id)
);
