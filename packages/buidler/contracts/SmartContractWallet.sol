pragma solidity >=0.6.0 <0.7.0;

import "@nomiclabs/buidler/console.sol";

contract SmartContractWallet {

    string public title = "📄 Smart Contract Wallet";
    address public owner;

    mapping(address => Commit) public commits;

    event CommitHash(address sender, bytes32 dataHash, uint64 block);
    event RevealAnswer(address sender, bytes32 answer, bytes32 salt);
    event UpdateOwner(address oldOwner, address newOwner);

    constructor(address _owner) public {
        owner = _owner;
        console.log("Smart Contract Wallet is owned by:", owner);
    }

    fallback() external payable {
        console.log(msg.sender, "just deposited", msg.value);
    }

    function withdraw() public {
        require(msg.sender == owner, "SmartContractWallet::withdraw\n Withdraw operation can be performed only by the owner");
        console.log(msg.sender, "withdraws", (address(this)).balance);
        msg.sender.transfer((address(this)).balance);
    }

    function updateOwner(address newOwner) public {
        require(msg.sender == owner, "SmartContractWallet::updateOwner\n Owner can be updated only by the owner.");
        console.log(msg.sender, "updates owner to", newOwner);
        owner = newOwner;
        emit UpdateOwner(msg.sender, owner);
    }

    struct Commit {
        bytes32 commit;
        uint64 block;
        bool revealed;
        bool commited;
    }

    function commit(bytes32 dataHash) public {
        require (!commits[msg.sender].commited, "Already committed");
        commits[msg.sender].commit = dataHash;
        commits[msg.sender].block = uint64(block.number);
        commits[msg.sender].revealed = false;
        commits[msg.sender].commited = true;
        emit CommitHash(msg.sender, commits[msg.sender].commit, commits[msg.sender].block);
    }

    function revealAnswer(bytes32 answer, bytes32 salt) public {
        //make sure it hasn't been revealed yet and set it to revealed
        require(commits[msg.sender].revealed == false, "CommitReveal::revealAnswer: Already revealed");
        commits[msg.sender].revealed = true;
        //require that they can produce the committed hash
        require(getSaltedHash(answer, salt) == commits[msg.sender].commit, "CommitReveal::revealAnswer: Revealed hash does not match commit");
        emit RevealAnswer(msg.sender, answer, salt);
    }

    function getSaltedHash(bytes32 data, bytes32 salt) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), data, salt));
    }

}
