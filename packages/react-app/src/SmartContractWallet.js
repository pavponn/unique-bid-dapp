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
    //TODO: set that last number to the block the contract is deployed (this needs to be automatic in the contract loader!?!)

    const contractAddress = readContracts ? readContracts[contractName].address : "";
    // const contractBalance = useBalance(contractAddress, props.localProvider);

    const [gameNumber, setGameNumber] = useState(undefined);
    const [isCommitted, setIsCommitted] = useState(false);

    const [salt, setSalt] = useState();
    const [hash, setHash] = useState();
    const hassssh = useContractReader(readContracts, contractName, "getSaltedHash", ["0x756e646566696e6564", "0x606cccb621282ac99ddc0769c5a4b59b7b46b7fa0cade5b49da809a71d21509f"], 1337);

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
        <Card className="left"
              title={smartContractInfoCardTitle}
              size="large"
              loading={!title}
              actions={[withdrawAction, depositAction]}>
            {smartContractInfoCardMeta}
        </Card>;

    const updateOwnerList =
        (<List className="right"
               header={<div><b>UpdateOwner</b> events</div>}
               bordered
               size="large"
               dataSource={ownerUpdates}
               renderItem={item => (
                   <List.Item style={{fontSize: 22}}>
                       <Blockies seed={item.oldOwner.toLowerCase()} size={8} scale={2}/> transferred ownership
                       to <Blockies seed={item.newOwner.toLowerCase()} size={8} scale={2}/>
                   </List.Item>
               )}
        />);

    const commitButton =
        <Button
            className="commit-button"
            size="2"
            shape="round"
            disabled={isCommitted || !gameNumber}
            onClick={
                async () => {
                    alert(hash);
                    alert(salt);
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
            disabled={!isCommitted}
            onClick={
                async () => {
                    // tx(
                    //     writeContracts['SmartContractWallet'].revealAnswer(
                    //         this.state.web3.utils.utf8ToHex(this.state.pres), this.state.salt),
                    //     120000,
                    //     0,
                    //     0,
                    //     (receipt) => {
                    //         if (receipt) {
                    //             console.log("REVEALED:", receipt)
                    //         }
                    //     }
                    // )
                }
            }
        >Reveal
        </Button>;

    const kek =
        <Card
            className="middle"
            title={<div><span role="img" aria-label="dice">🎲</span> Game zone</div>}
            size="large"
        >
            <Input
                className="game-input"
                placeholder={"your number"}
                type="number"
                max={3228}
                name="pres"
                value={gameNumber}
                onChange={
                    async (e) => {
                        if (("" + gameNumber).length > 10) {
                            return;
                        }
                        setGameNumber(e.target.value);
                        let bytes = Web3.utils.utf8ToHex("" + gameNumber).padEnd(66, '0');
                        let newSalt = Web3.utils.sha3("" + Math.random()).padEnd(66, '0');
                        let newHash = await readContracts[contractName].getSaltedHash(bytes, newSalt);
                        setHash(newHash);
                        setSalt(newSalt);
                    }
                }
            />
            <div>
                Salt: {salt}
            </div>
            <div>
                Hash: {hash}
            </div>
            <div className="buttons-wrapper">
                {commitButton}
                {revealButton}
            </div>
        </Card>;

    return (
        <div className="mainScreen">
            {smartContractInfoCard}
            {kek}
            {updateOwnerList}
        </div>
    );


}

