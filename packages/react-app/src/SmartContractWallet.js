import React from 'react'
import {ethers} from 'ethers';
import Blockies from 'react-blockies';
import {Card, Row, Col, List, Button, Input} from 'antd';
import {DownloadOutlined, UploadOutlined} from '@ant-design/icons';
import {useContractLoader, useContractReader, useEventListener, useBlockNumber, useBalance} from "./hooks"
import {Transactor} from './helpers'
import {Address, Balance, Timeline} from './components'
import './SmartContractWallet.css';

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

    const ownerUpdates = useEventListener(readContracts, contractName, "UpdateOwner", props.localProvider, 1);//set that last number to the block the contract is deployed (this needs to be automatic in the contract loader!?!)

    const contractAddress = readContracts ? readContracts[contractName].address : "";
    // const contractBalance = useBalance(contractAddress, props.localProvider);

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
            size="2"
            onClick={
                async () => {
                    // tx(
                    //     writeContracts['SmartContractWallet'].commit(this.state.hash),
                    //     120000,
                    //     0,
                    //     0,
                    //     (receipt) => {
                    //         if (receipt) {
                    //             console.log("COMMITTED:", receipt)
                    //         }
                    //     }
                    // );
                }
            }>
            Commit
        </Button>;

    const revealButton =
        <Button
            size="2"
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
        >
            Reveal Answer
        </Button>;

    const kek =
        <div className="middle">
            <div>This is question</div>
            <Input
                // style={{
                //     verticalAlign: "middle",
                //     width: 200,
                //     margin: 6,
                //     maxHeight: 20,
                //     padding: 5,
                //     border: '2px solid #ccc',
                //     borderRadius: 5
                // }}
                type="text" name="pres" value={""/*this.state.pres*/} onChange={(e) => {}/*this.handleInput.bind(this)*/} // TODO
            />
            <div>
                Salt: {"SAAALT" /*this.state.salt*/}
            </div>
            <div>
                Hash: {"HAASH" /*this.state.hash*/}
            </div>
            {commitButton}
            {revealButton}
        </div>;

    return (
        <div className="mainScreen">
            {smartContractInfoCard}
            {kek}
            {updateOwnerList}
        </div>
    );


}

