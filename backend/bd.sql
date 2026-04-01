--I use postgresql as my database management system, and the db hosting is supabase--

CREATE TABLE admin (
    id BIGSERIAL PRIMARY KEY,
    username TEXT,
    password TEXT,
    privileges TEXT
);


CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY,
    fullname TEXT,
    phonnum BIGINT,
    email TEXT,
    birthdate DATE
);


CREATE TABLE trip (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    descripiton TEXT,
    price MONEY,
    places INT,
    date DATERANGE,-- using daterange to store the start and end date of the trip
    media TEXT[] -- array of media links with out using claudinary or any other media hosting service
);


CREATE TABLE reservation (
    customer_id BIGINT NOT NULL REFERENCES customer(id),
    trip_id BIGINT NOT NULL REFERENCES trip(id),
    confirmation BOOLEAN,
    PRIMARY KEY (customer_id, trip_id)
);