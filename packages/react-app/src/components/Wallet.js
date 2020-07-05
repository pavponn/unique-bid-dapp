import React, {useState, useEffect} from 'react'
import Blockies from 'react-blockies';
import {Address, Balance, AddressInput, EtherInput} from "."
import {Transactor} from "../helpers"
import {WalletOutlined, QrcodeOutlined, SendOutlined} from '@ant-design/icons';
import {Typography, Skeleton, Tooltip, Spin, Modal, Button} from 'antd';
import QR from 'qrcode.react';
import {ethers} from "ethers";
import {isValidEth, valid} from "../helpers/Utils";

const {Text} = Typography;

const ETH_REGEX = "^[0-9]+.?[0-9]{0,18}$";

export default function Wallet(props) {

    const [open, setOpen] = useState(undefined);
    const [selectedAddress, setSelectedAddress] = useState(undefined);
    const [signer, setSigner] = useState(undefined);
    const [qr, setQr] = useState(undefined);
    const [showError, setShowError] = React.useState(false);
    const [amount, setAmount] = useState(undefined);
    const [toAddress, setToAddress] = useState(undefined);

    const setDefault = () => {
        setShowError(false);
        setAmount(undefined);
        setToAddress("");
    };

    let providerSend = "";
    if (props.provider) {

        providerSend = (
            <Tooltip title={"Wallet"}>
                <WalletOutlined onClick={() => {
                    setOpen(!open)
                }} rotate={-90} style={{
                    padding: 7,
                    color: props.color ? props.color : "#1890ff",
                    cursor: "pointer",
                    fontSize: 28,
                    verticalAlign: "middle"
                }}/>
            </Tooltip>
        )
    }

    useEffect(() => {
        (async () => {
            if (props.provider) {
                let loadedSigner;
                try {
                    loadedSigner = props.provider.getSigner();
                    setSigner(loadedSigner)
                } catch (e) {
                    console.log(e);
                }
                if (props.address) {
                    setSelectedAddress(props.address)
                } else {
                    if (!selectedAddress && loadedSigner) {
                        let result = await loadedSigner.getAddress();
                        if (result) {
                            setSelectedAddress(result)
                        }
                    }
                }
            }
        })();
    }, [props]);

    let display;
    let receiveButton;
    if (qr) {
        display = (
            <QR value={selectedAddress} size={"450"} level={"H"} includeMargin={true} renderAs={"svg"}
                imageSettings={{excavate: false}}/>
        );
        receiveButton = (
            <Button key="hide" onClick={() => {
                setQr("")
            }}>
                <QrcodeOutlined/> Hide
            </Button>
        )
    } else {

        const inputStyle = {
            padding: 10
        };

        display = (
            <div>
                <div style={inputStyle}>
                    <AddressInput
                        autoFocus={true}
                        ensProvider={props.ensProvider}
                        placeholder="to address"
                        value={toAddress}
                        onChange={setToAddress}
                    />
                </div>
                <div style={inputStyle}>
                    <EtherInput
                        price={props.price}
                        value={amount !== undefined ? amount + "" : ""}
                        placeholder="amount"
                        onChange={(value) => {
                            setShowError(false);
                            setAmount(value)
                        }}
                    />
                    {showError && <React.Fragment>Not valid ETH</React.Fragment>}
                </div>

            </div>
        );
        receiveButton = (
            <Button key="receive" onClick={() => {
                setQr(selectedAddress)
            }}>
                <QrcodeOutlined/> Receive
            </Button>
        )
    }
    const header =
        <div>
            {selectedAddress ? (
                <Address value={selectedAddress} ensProvider={props.ensProvider}/>
            ) : <Spin/>}
            <div style={{float: "right", paddingRight: 25}}>
                <Balance address={selectedAddress} provider={props.provider}
                         dollarMultiplier={props.price}/>
            </div>
        </div>;

    return (
        <span>
      {providerSend}
            <Modal
                visible={open}
                title={header}
                onOk={() => {
                    setOpen(!open);
                    setDefault();
                }}
                onCancel={() => {
                    setOpen(!open);
                    setDefault();
                }}
                footer={[
                    receiveButton,
                    <Button key="submit" type="primary" disabled={!amount || !toAddress || qr} loading={false}
                            onClick={() => {
                                console.log("TYPE" + typeof amount);
                                if (!("" + amount).match(ETH_REGEX)) {
                                    setShowError(true);
                                    return;
                                }
                                const tx = Transactor(props.provider);
                                tx({
                                    to: toAddress,
                                    value: ethers.utils.parseEther("" + amount),
                                });
                                setDefault();
                                setOpen(!open);
                            }}>
                        <SendOutlined/> Send
                    </Button>,
                ]}
            >
        {display}
      </Modal>
    </span>
    );
}
