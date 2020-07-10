import React, {useState} from 'react'
import {ethers} from 'ethers';
import Blockies from 'react-blockies';
import {Card, Row, Col, List, Button, Input} from 'antd';
import {DownloadOutlined, UploadOutlined} from '@ant-design/icons';
import {useContractLoader, useContractReader, useEventListener, useBlockNumber, useBalance} from "./hooks"
import {Transactor} from './helpers'
import {Address, Balance} from './components'
import './SmartContractWallet.css';
import Web3 from "web3";

const {Meta} = Card;

const contractName = "SmartContractWallet";

export default function SmartContractWallet(props) {

    const tx = Transactor(props.injectedProvider, props.gasPrice);

    const localBlockNumber = useBlockNumber(props.localProvider);
    const localBalance = useBalance(props.address, props.localProvider);

    const readContracts = useContractLoader(props.localProvider);
    const writeContracts = useContractLoader(props.injectedProvider);

    const title = useContractReader(readContracts, contractName, "title", 1777);
    const owner = useContractReader(readContracts, contractName, "owner", 1777);

    const ownerUpdates = useEventListener(readContracts, contractName, "UpdateOwner", props.localProvider, 1);
    const commitUpdates = useEventListener(readContracts, contractName, "CommitHash", props.localProvider, 1);
    const revealUpdates = useEventListener(readContracts, contractName, "RevealAnswer", props.localProvider, 1);

    //TODO: set that last number to the block the contract is deployed (this needs to be automatic in the contract loader!?!)

    const contractAddress = readContracts ? readContracts[contractName].address : "";
    // const contractBalance = useBalance(contractAddress, props.localProvider);

    const [gameNumber, setGameNumber] = useState(undefined);
    const [secret, setSecret] = useState(undefined);
    const [isCommitted, setIsCommitted] = useState(false);

    let displayAddress, displayOwner;

    if (readContracts && readContracts[contractName]) {
        displayAddress = (
            <Row>
                <Col span={8} style={{textAlign: "right", opacity: 0.333, paddingRight: 6, fontSize: 24}}>Deployed
                    to:</Col>
                <Col span={16}><Address value={contractAddress}/></Col>
            </Row>
        );
        displayOwner = (
            <Row>
                <Col span={8} style={{textAlign: "right", opacity: 0.333, paddingRight: 6, fontSize: 24}}>Owner:</Col>
                <Col span={16}><Address value={owner} onChange={(newOwner) => {
                    tx(
                        writeContracts['SmartContractWallet'].updateOwner(newOwner,
                            {gasLimit: ethers.utils.hexlify(40000)}
                        )
                    )
                }}/></Col>
            </Row>
        )
    }
    const smartContractInfoCardTitle =
        <div>
            {title}
            <div style={{float: 'right', opacity: title ? 0.77 : 0.33}}>
                <Balance
                    address={contractAddress}
                    provider={props.localProvider}
                    dollarMultiplier={props.price}
                />
            </div>
        </div>;

    const smartContractInfoCardMeta =
        <Meta
            description={(
                <div>
                    {displayAddress}
                    {displayOwner}
                </div>
            )}
        />;

    const withdrawAction =
        <div onClick={() => {
            tx(writeContracts['SmartContractWallet'].withdraw({gasLimit: ethers.utils.hexlify(40000)}))
        }}>
            <UploadOutlined/> Withdraw
        </div>;

    const depositAction =
        <div onClick={() => {
            tx({
                to: contractAddress,
                value: ethers.utils.parseEther('0.001'),
            })
        }}>
            <DownloadOutlined/> Deposit
        </div>;

    const smartContractInfoCard =
        <Card className="smartContractCard"
              title={smartContractInfoCardTitle}
              size="large"
              loading={!title}
              actions={[withdrawAction, depositAction]}>
            {smartContractInfoCardMeta}
        </Card>;

    const commitList =
        (<List className="commit-list"
               header={<div><b>Commit</b> events</div>}
               bordered
               size="large"
               dataSource={commitUpdates}
               renderItem={item => (
                   <List.Item style={{fontSize: 14}}>
                       <Blockies seed={item.sender.toLowerCase()} size={8} scale={2}/> committed number
                   </List.Item>
               )}
        />);

    const revealList =
        (<List className="reveal-list"
               header={<div><b>Reveal</b> events</div>}
               bordered
               size="large"
               dataSource={revealUpdates}
               renderItem={item => (
                   <List.Item style={{fontSize: 14}}>
                       <Blockies seed={item.sender.toLowerCase()} size={8} scale={2}/> revealed
                       their number <b>{ Web3.utils.hexToUtf8(item.answer)}</b>
                   </List.Item>
               )}
        />);

    const commitButton =
        <Button
            className="commit-button"
            size="2"
            shape="round"
            disabled={!gameNumber}
            onClick={
                async () => {
                    let bytes = Web3.utils.utf8ToHex("" + gameNumber).padEnd(66, '0');
                    let salt = Web3.utils.sha3("" + secret).padEnd(66, '0');
                    let hash = await readContracts[contractName].getSaltedHash(bytes, salt);
                    tx(
                        writeContracts['SmartContractWallet'].commit(hash),
                        120000,
                        0,
                        0,
                        (receipt) => {
                            if (receipt) {
                                console.log("COMMITTED:", receipt);
                                setIsCommitted(true);
                            }
                        }
                    );
                }
            }
        >Commit
        </Button>;

    const revealButton =
        <Button
            className="reveal-button"
            size="2"
            shape="round"
            disabled={!gameNumber}
            onClick={
                async () => {
                    let bytes = Web3.utils.utf8ToHex("" + gameNumber).padEnd(66, '0');
                    let salt = Web3.utils.sha3("" + secret).padEnd(66, '0');
                    tx(
                        writeContracts['SmartContractWallet'].revealAnswer(bytes, salt),
                        120000,
                        0,
                        0,
                        (receipt) => {
                            if (receipt) {
                                console.log("REVEALED:", receipt)
                            }
                        }
                    )
                }
            }
        >Reveal
        </Button>;

    const gameCard =
        <Card
            className="gameCard"
            title={<div><span role="img" aria-label="dice">🎲</span> Game zone</div>}
            size="large"
        >
            <Input
                className="gameCard__number-input"
                placeholder={"your number"}
                type="number"
                maxLength={10}
                name="pres"
                value={gameNumber}
                onChange={
                    async (e) => {
                        if (e.target.value.length > e.target.maxLength) {
                            e.target.value = e.target.value.slice(0, e.target.maxLength)
                        }
                        setGameNumber(e.target.value);
                    }
                }
            />
            <Input
                className="game__secret-input"
                placeholder={"your secret"}
                // type="string"
                maxLength={15}
                name="pres"
                value={secret}
                onChange={
                    async (e) => {
                        if (e.target.value.length > e.target.maxLength) {
                            e.target.value = e.target.value.slice(0, e.target.maxLength)
                        }
                        setSecret(e.target.value);
                    }
                }
            />
            <div className="buttons-wrapper">
                {commitButton}
                {revealButton}
            </div>
        </Card>;

    return (
        <div className="mainScreen">
            {smartContractInfoCard}
            {gameCard}
            {commitList}
            {revealList}
        </div>
    );


}

