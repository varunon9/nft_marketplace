import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { Buffer } from 'buffer'
// import { create } from 'ipfs-http-client'

// const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
// connect to ipfs daemon API server
// const ipfs = create('http://localhost:5001') // (the default in Node.js)
const { REACT_APP_INFURA_ID, REACT_APP_INFURA_SECRET_KEY } = process.env;

const auth =
    'Basic ' + Buffer.from(REACT_APP_INFURA_ID + ':' + REACT_APP_INFURA_SECRET_KEY).toString('base64');
const client = ipfsHttpClient({
    host: 'infura-ipfs.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});

const Create = ({ marketplace, nft }) => {
  const [assetUrl, setAssetUrl] = useState('');
  const [assetType, setAssetType] = useState('');
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    console.log('File: ', file);
    if (typeof file !== 'undefined') {
      setAssetType(file.type);
      try {
        const result = await client.add(file)
        console.log('Infura Upload Result:', result)
        setAssetUrl(`https://infura-ipfs.io/ipfs/${result.path}`)
      } catch (error){
        console.log("ipfs file upload error: ", error)
      }
    }
  }
  const createNFT = async () => {
    if (assetUrl && assetType && name && description && price) {
      try{
        const result = await client.add(JSON.stringify({assetUrl, assetType, price, name, description}))
        console.log('NFT to be created result:', result);
        mintThenList(result)
      } catch(error) {
        console.log("ipfs uri upload error: ", error)
      }
    }
  }
  const mintThenList = async (result) => {
    // const uri = `https://ipfs.infura.io/ipfs/${result.path}`
    const uri = `https://infura-ipfs.io/ipfs/${result.path}`
    console.log(uri)
    // mint nft 
    await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  }
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create