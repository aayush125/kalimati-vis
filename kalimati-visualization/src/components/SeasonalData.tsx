"use client";

import { seasonMostCommon } from "@/app/actions";
import { Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { TimelineIcon } from "./Icons";
import LineGraph from "./HomeLineGraph";

export default function SeasonData() {
  const [seasonData, setSeasonData] = useState({});
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  async function getData() {
    const ret = await seasonMostCommon();
    console.log(ret);
    setSeasonData(ret);
  }
  
  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">Price History</ModalHeader>
              <ModalBody>
                <LineGraph />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {seasonData ? "Data aayo" : "no data"}
      <div>
      <Table aria-label="Example static collection table">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>PRICE</TableColumn>
        <TableColumn>%</TableColumn>
        <TableColumn>GRAPH</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow key="1">
          <TableCell>Potato Red</TableCell>
          <TableCell>
          <Tooltip content={
            <div>
              Normal: Rs. 68.0<br />
              Indian: Rs. 55.0<br />
              Mude: Rs. 51.0<br />
            </div>
          } showArrow={true}>
          80 / kg
          </Tooltip>
          </TableCell>
          <TableCell><p className="text-red-300">+1.5%</p></TableCell>
          <TableCell>
          <Button isIconOnly color="default" variant="faded" onPress={() => {
            onOpen();
          }}>
            <TimelineIcon />
          </Button>
          </TableCell>
        </TableRow>
      </TableBody>
      </Table>
      </div>
    </>
  );
}
