FROM projectserum/build:v0.27.0

WORKDIR /anchor

COPY . .

RUN anchor build

EXPOSE 8899

CMD ["solana-test-validator"]
